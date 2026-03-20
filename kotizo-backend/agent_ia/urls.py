from django.urls import path
from . import views

urlpatterns = [
    path('message/', views.MessageIAView.as_view()),
    path('historique/', views.HistoriqueIAView.as_view()),
    path('reclamation/', views.ReclamationView.as_view()),
]