from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),  # Main page
    path('register/', views.register, name='register'),  # Registration page
    path('login/', views.login, name='login'),  # Login page
]
