from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('quarto/<int:pk>/', views.quartoDetalhe, name='quartoDetalhe'),
    path('contato/', views.contato, name='contato'),
    path('quartos/', views.quartos, name='quartos'),
]