import requests
from django.shortcuts import render
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
                    quartos = [
                        {
                            'nome': f'Quarto {i+1}',
                            'preco': 200 + (i * 50),
                            'imagem_url': img["urls"]["regular"]
                        }
                        for i, img in enumerate(data.get("results", []))
                    ]
                    print("✓ Quartos carregados da API Unsplash")
        except Exception as e:
            print(f"Erro ao buscar API Unsplash: {e}")
       
        
    
    return render(request, 'core/home.html', {'quartos': quartos})

def contato(request):
    """Página de contato"""
    return render(request, 'core/contato.html')