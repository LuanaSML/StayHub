import requests
import json
from datetime import datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.conf import settings
from django.contrib.auth import login, authenticate
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Quarto, Reserva
from django.contrib.auth.models import User



def home(request):
    quartos = []
    
    try:
        quartos = list(Quarto.objects.all()[:15])
    except Exception as e:
        print(f"Erro ao buscar BD: {e}")
    
    
    if not quartos:
        try:
            api_key = settings.UNSPLASH_ACCESS_KEY
            
            if api_key and api_key != "None":  
                url = "https://api.unsplash.com/search/photos"
                params = {
                    "query": "hotel room",
                    "per_page": 15,
                    "client_id": api_key
                }
                response = requests.get(url, params=params, timeout=5)
                
                if response.status_code == 200:
                    data = response.json()
                    quartos_data = [
                        {
                            'nome': f'Quarto {i+1}',
                            'preco': 200 + (i * 50),
                            'imagem_url': img["urls"]["regular"],
                            'descricao': img.get('description') or img.get('alt_description') or ''
                        }
                        for i, img in enumerate(data.get("results", []))
                    ]
                    # Persistir (ou recuperar) no banco para garantir IDs e paginação de detalhe
                    quartos = []
                    for item in quartos_data:
                        try:
                            obj, created = Quarto.objects.get_or_create(
                                imagem_url=item['imagem_url'],
                                defaults={
                                    'nome': item['nome'],
                                    'preco': item['preco'],
                                    'descricao': item.get('descricao', '')
                                }
                            )
                            quartos.append(obj)
                        except Exception as e:
                            # Se persistir falhar, adicione ao array como dict (fallback)
                            print(f"Falha ao salvar Quarto: {e}")
                            quartos.append(item)
                    print("✓ Quartos carregados (API Unsplash) e sincronizados com o banco")
        except Exception as e:
            print(f"Erro ao buscar API Unsplash: {e}")
       
        
    
    return render(request, 'core/home.html', {'quartos': quartos})

def contato(request):
    """Página de contato"""
    return render(request, 'core/contato.html')


def quartoDetalhe(request, pk):
    """Exibe a página de detalhe para um quarto específico."""
    quarto = get_object_or_404(Quarto, pk=pk)
    return render(request, 'core/quartoDetalhe.html', {'quarto': quarto})

def quartos(request):
    """Página de quartos reservados"""
    if request.user.is_authenticated:
        reservas = Reserva.objects.filter(usuario=request.user).order_by('-criado_em')
    else:
        reservas = []
    return render(request, 'core/quartos.html', {'reservas': reservas})

@login_required
@csrf_exempt
@require_http_methods(["POST"])
def criar_reserva(request):
    """View para criar uma nova reserva"""
    try:
        data = json.loads(request.body)
        quarto_id = data.get('quarto_id')
        checkin_str = data.get('checkin')
        checkout_str = data.get('checkout')
        hospedes = data.get('hospedes')
        
        if not all([quarto_id, checkin_str, checkout_str, hospedes]):
            return JsonResponse({'success': False, 'message': 'Todos os campos são obrigatórios.'}, status=400)
        
        quarto = get_object_or_404(Quarto, pk=quarto_id)
        checkin = datetime.strptime(checkin_str, '%Y-%m-%d').date()
        checkout = datetime.strptime(checkout_str, '%Y-%m-%d').date()
        
        # Validar datas
        if checkout <= checkin:
            return JsonResponse({'success': False, 'message': 'A data de check-out deve ser posterior à data de check-in.'}, status=400)
        
        # Calcular valor total (preço do quarto * número de dias)
        dias = (checkout - checkin).days
        valor_total = quarto.preco * dias
        
        # Criar reserva
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
    """View para exibir a página de pagamento"""
    try:
        reserva = Reserva.objects.get(pk=reserva_id, usuario=request.user)
    except Reserva.DoesNotExist:
        messages.error(request, 'Reserva não encontrada.')
        return redirect('home')
    
    return render(request, 'core/pagamento.html', {'reserva': reserva})

@csrf_exempt
@require_http_methods(["POST"])
def finalizar_pagamento(request):
    """View para finalizar o pagamento"""
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
    """View para cadastro de novos usuários via API"""
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
        
        # Criar usuário
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
    """View para login de usuários via API"""
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

def logout_view(request):
    """View para logout de usuários"""
    from django.contrib.auth import logout
    if request.user.is_authenticated:
        logout(request)
        messages.success(request, 'Você foi desconectado com sucesso.')
    return redirect('home')