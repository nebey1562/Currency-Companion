import sys
import json
from gtts import gTTS
from io import BytesIO
import pygame

def main():
    input_data = sys.stdin.read()
    data = json.loads(input_data)
    text_to_speak = []

    text_to_speak.append(f"Page Title: {data['pageTitle']}")
    text_to_speak.append("Headers found on the page are:")
    text_to_speak.extend(data['headers'])

    text_to_speak.append("Buttons available on the page are:")
    text_to_speak.extend(data['buttons'])

    text_to_speak.append("Input fields present on the page are:")
    for field in data['inputFields']:
        placeholder = field['placeholder'] if field['placeholder'] else 'No placeholder'
        input_type = field['type']
        text_to_speak.append(f"Input field with placeholder {placeholder} and type {input_type}")
    final_text = " ".join(text_to_speak)
    tts = gTTS(text=final_text, lang='en')
    fp = BytesIO()
    tts.write_to_fp(fp)
    fp.seek(0)
    pygame.mixer.init()
    pygame.mixer.music.load(fp)
    pygame.mixer.music.play()
    while pygame.mixer.music.get_busy():
        continue

if __name__ == "__main__":
    main()
