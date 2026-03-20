from django.urls import path
from . import views

urlpatterns = [
    path('', views.CotisationListCreateView.as_view()),
    path('mes-participations/', views.MesParticipationsView.as_view()),
    path('publique/<str:slug>/', views.CotisationPubliqueView.as_view()),
    path('<str:slug>/', views.CotisationDetailView.as_view()),
    path('<str:slug>/rejoindre/', views.RejoindreView.as_view()),
    path('<str:slug>/participants/', views.ParticipantsView.as_view()),
    path('<str:slug>/rappeler/', views.RappelerNonPayeursView.as_view()),
    path('<str:slug>/signaler/', views.SignalerView.as_view()),
    path('participation/<uuid:participation_id>/confirmer-recu/', views.ConfirmerRecuView.as_view()),
]