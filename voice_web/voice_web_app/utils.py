import os
import librosa
import numpy as np
from scipy.spatial.distance import cosine

def extract_features(file_path):
    audio, sr = librosa.load(file_path, sr=None)
    mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
    return np.mean(mfccs.T, axis=0)

def verify_voice(user_id, voice_file):
    registration_path = os.path.join('voice_samples', user_id, 'registration.wav')
    if not os.path.exists(registration_path):
        return False

    # Extract features for both files
    registered_features = extract_features(registration_path)
    temp_path = 'temp_voice.wav'
    with open(temp_path, 'wb') as f:
        f.write(voice_file.read())

    new_features = extract_features(temp_path)
    os.remove(temp_path)

    # Compare using cosine similarity
    similarity = 1 - cosine(registered_features, new_features)
    return similarity > 0.8  # Threshold for verification
