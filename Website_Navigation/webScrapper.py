import requests
from bs4 import BeautifulSoup

url = 'http://localhost:8501'

response = requests.get(url)
if response.status_code == 200:
    html_content = response.text
else:
    print(f'Failed to retrieve the page. Status code: {response.status_code}')
    exit()
soup = BeautifulSoup(html_content, 'html.parser')

def extract_key_features(soup):
    title = soup.title.string if soup.title else 'No title found'
    print(f'Page Title: {title}\n')
    headers = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    print('Headers:')
    for header in headers:
        print(f'  {header.name}: {header.get_text(strip=True)}')
    print()
    buttons = soup.find_all('button')
    print('Buttons:')
    for button in buttons:
        print(f'  Button Text: {button.get_text(strip=True)}')
    print()
    inputs = soup.find_all('input')
    print('Input Fields:')
    for input_field in inputs:
        input_type = input_field.get('type', 'text')
        input_name = input_field.get('name', 'Unnamed')
        print(f'  Input Name: {input_name}, Type: {input_type}')
    print()

extract_key_features(soup)