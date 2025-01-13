let mediaRecorder;
let audioChunks = [];

document.getElementById('start-recording').addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();

        mediaRecorder.addEventListener('dataavailable', (event) => {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();

            const fileInput = document.querySelector('input[name="voice_file"]');
            const file = new File([audioBlob], "voice.wav", { type: 'audio/wav' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
        });
    });
});

document.getElementById('stop-recording').addEventListener('click', () => {
    mediaRecorder.stop();
    audioChunks = [];
});
