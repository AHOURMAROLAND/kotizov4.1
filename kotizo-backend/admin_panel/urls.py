from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardStatsView.as_view()),
    path('users/', views.UsersAdminListView.as_view()),
    path('users/<uuid:user_id>/', views.UserAdminDetailView.as_view()),
    path('verifications/', views.VerificationsAdminView.as_view()),
    path('verifications/<int:verif_id>/approuver/', views.ApprouverVerificationView.as_view()),
    path('verifications/<int:verif_id>/rejeter/', views.RejeterVerificationView.as_view()),
    path('sanctions/', views.SanctionsAdminView.as_view()),
    path('remboursements/', views.RemboursementsAdminView.as_view()),
    path('remboursements/<int:demande_id>/traiter/', views.ValiderRemboursementView.as_view()),
    path('tickets/', views.TicketsAdminView.as_view()),
    path('tickets/<int:ticket_id>/', views.TicketsAdminView.as_view()),
    path('promo-verification/', views.PromoVerificationView.as_view()),
    path('state-logs/', views.StateLogs.as_view()),
]