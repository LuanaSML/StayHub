from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('quarto/<int:pk>/', views.quartoDetalhe, name='quartoDetalhe'),
    path('contato/', views.contato, name='contato'),
    path('quartos/', views.quartos, name='quartos'),
    path('api/cadastro/', views.cadastro, name='cadastro'),
    path('api/login/', views.login_view, name='login_view'),
    path('api/logout/', views.logout_view, name='logout_view'),
    path('api/reserva/', views.criar_reserva, name='criar_reserva'),
    path('pagamento/<int:reserva_id>/', views.pagamento, name='pagamento'),
    path('api/finalizar-pagamento/', views.finalizar_pagamento, name='finalizar_pagamento'),
    path('api/eliminar-reserva/', views.eliminar_reserva, name='eliminar_reserva'),
    path('api/mudar-nome/', views.mudar_nome, name='mudar_nome'),
]