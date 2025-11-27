# IMPORTAÇÕES - NECESSÁRIOS

import json
from datetime import datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Quarto, Reserva
from django.contrib.auth.models import User


# VIEWS DE PÁGINAS - RENDERIZAM TEMPLATES HTML
# View da pagina inicial home. a def vai procurar os quartos disponiveis 
#no banco de dados e vai mostrar na tela (os primeiros 15 quartos) 

def home(request):
   
    quartos = []
    
    try:
        quartos = list(Quarto.objects.all()[:15])
    except Exception as e:
        print(f"Erro ao buscar BD: {e}")
    
    return render(request, 'core/home.html', {'quartos': quartos})

def contato(request):
    """apenas renderiza o template"""
    return render(request, 'core/contato.html')

def quartoDetalhe(request, pk):
    
    quarto = get_object_or_404(Quarto, pk=pk)
    return render(request, 'core/quartoDetalhe.html', {'quarto': quarto})

def quartos(request):
    
    if request.user.is_authenticated:
        reservas = Reserva.objects.filter(usuario=request.user).select_related('quarto').order_by('-criado_em')
    else:
        reservas = []
    
    return render(request, 'core/quartos.html', {'reservas': reservas})


















# VIEWS DE API - RETORNAM JSON (USADAS PELO JAVASCRIPT)

@login_required
@csrf_exempt
@require_http_methods(["POST"])
def criar_reserva(request):
    
    """
    View para criar uma nova reserva via API
    Quando o usuário preenche o formulário de reserva e clica em "Reservar",
    o JavaScript envia os dados para esta função, que cria a reserva no banco.
    """

    #leer os dados do js
    try:
        data = json.loads(request.body)
        quarto_id = data.get('quarto_id')
        checkin_str = data.get('checkin')
        checkout_str = data.get('checkout')
        hospedes = data.get('hospedes')
        
        #validar os campos
        if not all([quarto_id, checkin_str, checkout_str, hospedes]):
            return JsonResponse({'success': False, 'message': 'Todos os campos são obrigatórios.'}, status=400)
        
        quarto = get_object_or_404(Quarto, pk=quarto_id)
        checkin = datetime.strptime(checkin_str, '%Y-%m-%d').date()
        checkout = datetime.strptime(checkout_str, '%Y-%m-%d').date()
        
        # Validar datas
        if checkout <= checkin:
            return JsonResponse({'success': False, 'message': 'A data de check-out deve ser posterior à data de check-in.'}, status=400)
        
        # Verificar se já existe reserva para o mesmo quarto nas mesmas datas
        # Uma reserva conflita se as datas se sobrepõem
        reservas_existentes = Reserva.objects.filter(
            quarto=quarto
        ).filter(
            checkin__lt=checkout,
            checkout__gt=checkin
        )
        
        if reservas_existentes.exists():
            reserva_existente = reservas_existentes.first()
            return JsonResponse({
                'success': False, 
                'message': f'Este quarto já está reservado de {reserva_existente.checkin.strftime("%d/%m/%Y")} a {reserva_existente.checkout.strftime("%d/%m/%Y")}. Escolha outras datas.'
            }, status=400)
        
        # Verificar se o mesmo usuário já tem reserva para o mesmo quarto
        reservas_usuario = Reserva.objects.filter(
            usuario=request.user,
            quarto=quarto
        ).filter(
            checkin__lt=checkout,
            checkout__gt=checkin
        )
        
        if reservas_usuario.exists():
            return JsonResponse({
                'success': False, 
                'message': 'Você já possui uma reserva para este quarto neste período. Escolha outras datas.'
            }, status=400)
        
        # Calcular valor total (preço do quarto * número de dias)
        dias = (checkout - checkin).days
        valor_total = quarto.preco * dias
        
        # Criar reserva no banco de dados
        reserva = Reserva.objects.create(
            usuario=request.user,
            quarto=quarto,
            checkin=checkin,
            checkout=checkout,
            hospedes=int(hospedes),
            valor_total=valor_total,
            pago=False
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Reserva criada com sucesso!',
            'reserva_id': reserva.id
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Erro ao processar os dados.'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erro ao criar reserva: {str(e)}'}, status=500)

@login_required
def pagamento(request, reserva_id):
    """
    View para exibir a página de pagamento
    Após criar uma reserva, o usuário é redirecionado para esta página.
    Busca os dados da reserva no banco e mostra na tela.
    """
    try:
        reserva = Reserva.objects.get(pk=reserva_id, usuario=request.user)
    except Reserva.DoesNotExist:
        messages.error(request, 'Reserva não encontrada.')
        return redirect('home')
    
    return render(request, 'core/pagamento.html', {'reserva': reserva})

@csrf_exempt
@require_http_methods(["POST"])
def finalizar_pagamento(request):
    """
    View para finalizar o pagamento de uma reserva via API
    Quando o usuário clica no botão "Pagamento Realizado", marca a reserva
    como paga no banco de dados (reserva.pago = True)
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Você precisa estar logado.'}, status=401)
    
    try:
        data = json.loads(request.body)
        reserva_id = data.get('reserva_id')
        
        if not reserva_id:
            return JsonResponse({'success': False, 'message': 'ID da reserva não fornecido.'}, status=400)
        
        try:
            reserva = Reserva.objects.get(pk=reserva_id, usuario=request.user, pago=False)
        except Reserva.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Reserva não encontrada.'}, status=404)
        
        # Marcar como pago
        reserva.pago = True
        reserva.save()
        
        # Verificar se foi salvo corretamente
        reserva.refresh_from_db()
        if not reserva.pago:
            return JsonResponse({'success': False, 'message': 'Erro ao salvar o pagamento.'}, status=500)
        
        print(f"✓ Pagamento finalizado: Reserva {reserva_id} marcada como paga para usuário {request.user.username}")
        
        return JsonResponse({
            'success': True,
            'message': 'Pagamento realizado com sucesso!',
            'redirect_url': '/quartos/'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Erro ao processar os dados.'}, status=400)
    except Exception as e:
        print(f"✗ Erro ao finalizar pagamento: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'message': f'Erro ao finalizar pagamento: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def cadastro(request):
    """
    View para cadastro de novos usuários via API
    Quando o usuário preenche o formulário de cadastro e clica em "REGISTRAR",
    cria a conta do usuário no banco de dados e faz login automático.
    
    Validações:
    - Verifica se todos os campos foram preenchidos
    - Verifica se a senha tem pelo menos 6 caracteres
    - Verifica se o email já está cadastrado
    - Cria o usuário no banco (senha é criptografada automaticamente)
    - Faz login automático
    """
    if request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Você já está logado.'}, status=400)
    
    try:
        data = json.loads(request.body)
        nome = data.get('nome', '').strip()
        email = data.get('email', '').strip()
        senha = data.get('senha', '').strip()
        
        # Validações
        if not nome or not email or not senha:
            return JsonResponse({'success': False, 'message': 'Todos os campos são obrigatórios.'}, status=400)
        
        if len(senha) < 6:
            return JsonResponse({'success': False, 'message': 'A senha deve ter pelo menos 6 caracteres.'}, status=400)
        
        # Verificar se email já existe
        if User.objects.filter(email=email).exists():
            return JsonResponse({'success': False, 'message': 'Este email já está cadastrado.'}, status=400)
        
        # Verificar se username já existe (usando email como username)
        if User.objects.filter(username=email).exists():
            return JsonResponse({'success': False, 'message': 'Este email já está cadastrado.'}, status=400)
        
        # Criar usuário no banco de dados
        # User.objects.create_user() criptografa a senha automaticamente
        user = User.objects.create_user(
            username=email,
            email=email,
            password=senha,
            first_name=nome
        )
        
        # Fazer login automático
        user = authenticate(request, username=email, password=senha)
        if user is not None:
            login(request, user)
            return JsonResponse({
                'success': True,
                'message': 'Conta criada com sucesso!',
                'user': {
                    'username': user.username,
                    'first_name': user.first_name
                }
            })
        else:
            return JsonResponse({'success': False, 'message': 'Erro ao fazer login após cadastro.'}, status=500)
            
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Erro ao processar os dados.'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erro ao criar conta: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    """
    View para login de usuários via API
    Quando o usuário preenche o formulário de login e clica em "ENTRAR",
    autentica o usuário (verifica email e senha) e cria uma sessão de login.
    """
    if request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Você já está logado.'}, status=400)
    
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        senha = data.get('senha', '').strip()
        
        if not email or not senha:
            return JsonResponse({'success': False, 'message': 'Por favor, preencha todos os campos.'}, status=400)
        
        # Tentar autenticar usando email como username
        user = authenticate(request, username=email, password=senha)
        if user is not None:
            login(request, user)
            return JsonResponse({
                'success': True,
                'message': 'Login realizado com sucesso!',
                'user': {
                    'username': user.username,
                    'first_name': user.first_name
                }
            })
        else:
            return JsonResponse({'success': False, 'message': 'Email ou senha incorretos.'}, status=401)
            
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Erro ao processar os dados.'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erro ao fazer login: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    """
    View para logout de usuários via API
    Quando o usuário clica no botão "SAIR", encerra a sessão do usuário.
    Não deleta a conta, apenas encerra a sessão (pode fazer login novamente).
    """
    from django.contrib.auth import logout
    if request.user.is_authenticated:
        logout(request)
        return JsonResponse({
            'success': True,
            'message': 'Você foi desconectado com sucesso.'
        })
    return JsonResponse({
        'success': False,
        'message': 'Você não está logado.'
    }, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def mudar_nome(request):
    """
    View para mudar o nome do usuário via API
    Quando o usuário clica no nome no header e escolhe mudar o nome,
    atualiza o campo first_name do usuário no banco de dados.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Você precisa estar logado.'}, status=401)
    
    try:
        data = json.loads(request.body)
        novo_nome = data.get('novo_nome', '').strip()
        
        if not novo_nome:
            return JsonResponse({'success': False, 'message': 'O nome não pode estar vazio.'}, status=400)
        
        # Atualizar o nome do usuário no banco de dados
        request.user.first_name = novo_nome
        request.user.save()
        
        print(f"✓ Nome atualizado: {request.user.username} -> {novo_nome}")
        
        return JsonResponse({
            'success': True,
            'message': 'Nome atualizado com sucesso!',
            'novo_nome': novo_nome
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Erro ao processar os dados.'}, status=400)
    except Exception as e:
        print(f"✗ Erro ao mudar nome: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'message': f'Erro ao atualizar nome: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def eliminar_reserva(request):
    """
    View para eliminar uma reserva via API
    Quando o usuário clica no botão de eliminar (ícone de lixeira) na página
    de quartos reservados, remove a reserva do banco de dados.
    Ao deletar, as datas ficam automaticamente liberadas para outros usuários.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Você precisa estar logado.'}, status=401)
    
    try:
        data = json.loads(request.body)
        reserva_id = data.get('reserva_id')
        
        if not reserva_id:
            return JsonResponse({'success': False, 'message': 'ID da reserva não fornecido.'}, status=400)
        
        try:
            reserva = Reserva.objects.get(pk=reserva_id, usuario=request.user)
        except Reserva.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Reserva não encontrada.'}, status=404)
        
        # Deletar a reserva (isso libera as datas automaticamente)
        reserva.delete()
        
        print(f"✓ Reserva {reserva_id} eliminada por usuário {request.user.username}")
        
        return JsonResponse({
            'success': True,
            'message': 'Reserva eliminada com sucesso!'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Erro ao processar os dados.'}, status=400)
    except Exception as e:
        print(f"✗ Erro ao eliminar reserva: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'message': f'Erro ao eliminar reserva: {str(e)}'}, status=500)
