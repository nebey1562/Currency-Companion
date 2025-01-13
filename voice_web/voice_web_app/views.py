from django.shortcuts import render, redirect
from django.http import JsonResponse
import os

# Home page with options for registration and login
def home(request):
    return render(request, 'main.html')

# Registration page
def register(request):
    if request.method == 'POST':
        user_id = request.POST.get('user_id')
        voice_file = request.FILES.get('voice_file')

        if user_id and voice_file:
            save_dir = os.path.join('voice_samples', user_id)
            os.makedirs(save_dir, exist_ok=True)
            with open(os.path.join(save_dir, 'registration.wav'), 'wb') as f:
                f.write(voice_file.read())
            return JsonResponse({'message': 'Voice registered successfully!'})

    return render(request, 'register.html')

# Login page
def login(request):
    if request.method == 'POST':
        user_id = request.POST.get('user_id')
        voice_file = request.FILES.get('voice_file')

        if user_id and voice_file:
            # Compare voice_file with registration.wav for the user_id
            result = verify_voice(user_id, voice_file)  # Implement verify_voice logic
            if result:
                return JsonResponse({'message': 'User verified!'})
            else:
                return JsonResponse({'message': 'Voice does not match.'})

    return render(request, 'login.html')
