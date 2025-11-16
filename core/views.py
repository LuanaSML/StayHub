import requests
from django.shortcuts import render, get_object_or_404
from django.conf import settings
from .models import Quarto



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