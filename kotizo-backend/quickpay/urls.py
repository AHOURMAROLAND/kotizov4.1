from django.urls import path
from . import views

urlpatterns = [
    path('', views.QuickPayListCreateView.as_view()),
    path('recus/', views.QuickPayRecusView.as_view()),
    path('webhook/', views.WebhookQuickPayView.as_view()),
    path('<str:code>/', views.QuickPayDetailView.as_view()),
    path('<str:code>/payer/', views.InitierPaiementQuickPayView.as_view()),
]