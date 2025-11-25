import requests
from django.shortcuts import render, get_object_or_404, redirect
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from datetime import datetime, timedelta
import json
from .models import Quarto, Reserva



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
    reservas = []
    if request.user.is_authenticated:
        reservas = Reserva.objects.filter(usuario=request.user, pago=True).select_related('quarto').order_by('-criado_em')
        print(f"✓ Usuário {request.user.username} tem {reservas.count()} reservas pagas")
    return render(request, 'core/quartos.html', {'reservas': reservas})

@csrf_exempt
@require_http_methods(["POST"])
def cadastro(request):
    """View para criar uma nova conta"""
    try:
        data = json.loads(request.body)
        nome = data.get('nome', '').strip()
        email = data.get('email', '').strip()
        senha = data.get('senha', '').strip()
        
        # Validações
        if not nome or not email or not senha:
            return JsonResponse({'success': False, 'message': 'Todos os campos são obrigatórios.'}, status=400)
        
        # Verificar se o nome já existe
        if User.objects.filter(username=nome).exists():
            return JsonResponse({'success': False, 'message': 'Este nome já está em uso. Escolha outro nome.'}, status=400)
        
        # Verificar se o email já existe
        if User.objects.filter(email=email).exists():
            return JsonResponse({'success': False, 'message': 'Este email já está cadastrado. Use outro email.'}, status=400)
        
        # Criar usuário
        user = User.objects.create_user(
            username=nome,
            email=email,
            password=senha,
            first_name=nome
        )
        
        # Fazer login automático
        login(request, user)
        
        return JsonResponse({
            'success': True, 
            'message': 'Conta criada com sucesso!',
            'user': {
                'nome': user.first_name or user.username,
                'email': user.email
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Erro ao processar os dados.'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erro ao criar conta: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    """View para fazer login"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        senha = data.get('senha', '').strip()
        
        if not email or not senha:
            return JsonResponse({'success': False, 'message': 'Email e senha são obrigatórios.'}, status=400)
        
        # Tentar encontrar o usuário pelo email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Email ou senha incorretos.'}, status=400)
        
        # Autenticar
        user = authenticate(request, username=user.username, password=senha)
        
        if user is not None:
            login(request, user)
            return JsonResponse({
                'success': True,
                'message': 'Login realizado com sucesso!',
                'user': {
                    'nome': user.first_name or user.username,
                    'email': user.email
                }
            })
        else:
            return JsonResponse({'success': False, 'message': 'Email ou senha incorretos.'}, status=400)
            
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Erro ao processar os dados.'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erro ao fazer login: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    """View para fazer logout"""
    logout(request)
    return JsonResponse({'success': True, 'message': 'Logout realizado com sucesso!'})

@csrf_exempt
@require_http_methods(["POST"])
def criar_reserva(request):
    """View para criar uma reserva"""
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Você precisa estar logado para fazer uma reserva.'}, status=401)
    
    try:
        data = json.loads(request.body)
        quarto_id = data.get('quarto_id')
        checkin_str = data.get('checkin')
        checkout_str = data.get('checkout')
        hospedes = data.get('hospedes')
        
        # Validações básicas
        if not quarto_id or not checkin_str or not checkout_str or not hospedes:
            return JsonResponse({'success': False, 'message': 'Todos os campos são obrigatórios.'}, status=400)
        
        # Buscar quarto
        try:
            quarto = Quarto.objects.get(pk=quarto_id)
        except Quarto.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Quarto não encontrado.'}, status=404)
        
        # Converter datas
        try:
            checkin = datetime.strptime(checkin_str, '%Y-%m-%d').date()
            checkout = datetime.strptime(checkout_str, '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse({'success': False, 'message': 'Datas inválidas.'}, status=400)
        
        # Validar que checkout é depois de checkin
        if checkout <= checkin:
            return JsonResponse({'success': False, 'message': 'A data de check-out deve ser posterior à data de check-in.'}, status=400)
        
        # Validar que as datas não são no passado
        hoje = timezone.now().date()
        if checkin < hoje:
            return JsonResponse({'success': False, 'message': 'A data de check-in não pode ser no passado.'}, status=400)
        
        # Verificar conflito de datas
        # Há conflito se há sobreposição: checkin_novo < checkout_existente E checkout_novo > checkin_existente
        reservas_existentes = Reserva.objects.filter(
            quarto=quarto,
            pago=True
        ).filter(
            checkin__lt=checkout,
            checkout__gt=checkin
        )
        
        if reservas_existentes.exists():
            return JsonResponse({
                'success': False, 
                'message': 'Este quarto já está reservado para o período selecionado. Escolha outras datas.'
            }, status=400)
        
        # Usar o preço do quarto como valor total (preço mensal)
        valor_total = quarto.preco
        
        # Criar reserva (ainda não paga)
        reserva = Reserva.objects.create(
            usuario=request.user,
            quarto=quarto,
            checkin=checkin,
            checkout=checkout,
            hospedes=int(hospedes),
            valor_total=valor_total,
            pago=False
        )
        
        # Redirecionar para página de pagamento
        return JsonResponse({
            'success': True,
            'message': 'Reserva criada com sucesso!',
            'reserva_id': reserva.id
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Erro ao processar os dados.'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': f'Erro ao criar reserva: {str(e)}'}, status=500)

def pagamento(request, reserva_id):
    """View para página de pagamento"""
    if not request.user.is_authenticated:
        return redirect('home')
    
    try:
        reserva = Reserva.objects.select_related('quarto').get(pk=reserva_id, usuario=request.user, pago=False)
    except Reserva.DoesNotExist:
        # Se a reserva não existe ou já foi paga, redirecionar
        print(f"Reserva {reserva_id} não encontrada para usuário {request.user.username}")
        return redirect('home')
    except Exception as e:
        # Log do erro para debug
        print(f"Erro ao buscar reserva: {e}")
        import traceback
        traceback.print_exc()
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