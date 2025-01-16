import cv2
import numpy as np
import tensorflow as tf
import os

# Load the trained model
model = tf.keras.models.load_model('currency_counter.keras')

# Class labels (map index to currency denomination)
class_labels = {0: 10, 1: 20, 2: 50, 3: 100, 4: 200, 5: 500}

# Preprocess image for the model
def preprocess_image(frame):
    img = cv2.resize(frame, (224, 224))
    img = img / 255.0  # Normalize
    img = np.expand_dims(img, axis=0)  # Add batch dimension
    return img

# Predict denomination of a captured image
def predict_denomination(frame, model, class_labels):
    img = preprocess_image(frame)
    prediction = model.predict(img, verbose=0)
    class_idx = np.argmax(prediction)
    return class_labels[class_idx]

# Main function
def main():
    cap = cv2.VideoCapture(0)  # Open the camera by default
    if not cap.isOpened():
        print("Failed to open the camera. Please check your device.")
        return

    captured_images = []
    total_sum = 0
    print("Press 'c' to capture images, 't' to display total, 'q' to quit.")
    
    while True:
        key = cv2.waitKey(1) & 0xFF  # Wait for a key press

        # Capture an image
        if key == ord('c'):
            ret, frame = cap.read()
            if ret:
                captured_images.append(frame)
                print(f"Image captured! Total images captured: {len(captured_images)}")
            else:
                print("Failed to capture image.")
        
        # Calculate and display the total
        elif key == ord('t'):
            if not captured_images:
                print("No images captured. Please capture images first.")
            else:
                total_sum = 0
                for i, img in enumerate(captured_images):
                    denom = predict_denomination(img, model, class_labels)
                    total_sum += denom
                    print(f"Image {i+1}: ₹{denom}")
                print(f"Total Sum: ₹{total_sum}")
        
        # Quit the program
        elif key == ord('q'):
            print("Exiting the program.")
            cap.release()
            cv2.destroyAllWindows()
            break
        
        # Display the camera feed
        ret, frame = cap.read()
        if ret:
            cv2.imshow("Camera Feed", frame)
        else:
            print("Error reading from camera. Please check your device.")

# Run the program
if __name__ == "__main__":
    main()
