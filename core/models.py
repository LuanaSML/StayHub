from django.db import models
from django.contrib.auth.models import User

class Quarto(models.Model):
    nome = models.CharField(max_length=255)
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    imagem_url = models.URLField(max_length=500, blank=True, null=True)
    descricao = models.TextField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome

    class Meta:
        ordering = ['-criado_em']

class Reserva(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    quarto = models.ForeignKey(Quarto, on_delete=models.CASCADE)
    checkin = models.DateField()
    checkout = models.DateField()
    hospedes = models.IntegerField()
    valor_total = models.DecimalField(max_digits=10, decimal_places=2)
    pago = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario.username} - {self.quarto.nome} ({self.checkin} a {self.checkout})"

    class Meta:
        ordering = ['-criado_em']
