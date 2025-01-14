import streamlit as st

# Dummy user data
users = {"user1": "password1", "user2": "password2"}
user_balance = {"user1": 1000, "user2": 1500}

# Configure the page
st.set_page_config(page_title="Currency Companion", page_icon="💰")

st.markdown(
    """
    <style>
    body {
        background-color: #222222; /* Dark background */
    }
    .center-box {
        width: 5%;  /* Narrower box width */
        margin: 0 auto; /* Center the box horizontally */
        background-color: #333333; /* Dark gray box */
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.5);
    }
    .input-field label {
        color: #FFFFFF; /* White font for labels */
    }
    .stButton button {
        background-color: #FFD700; /* Gold button */
        color: black;
        font-weight: bold;
        border-radius: 5px;
        width: 100%;
    }
    .stButton button:hover {
        background-color: #FFC107; /* Lighter gold on hover */
    }
    /* Custom styling for text input fields */
    .stTextInput input {
        color: #FFFFFF; /* White text for input fields */
        background-color: #555555; /* Slightly lighter background for input fields */
        border: 1px solid #FFFFFF; /* White border */
    }
    .stTextInput label {
        color: #FFFFFF; /* White label for input fields */
    }
    .stNumberInput input {
        color: #FFFFFF; /* White text for input fields */
        background-color: #555555; /* Slightly lighter background for input fields */
        border: 1px solid #FFFFFF; /* White border */
    }
    .stNumberInput label {
        color: #FFFFFF; /* White label for input fields */
    }
    .balance-text {
        color: #FFFFFF; /* White text color */
    }
    </style>
    """,
    unsafe_allow_html=True,
)


def go_home_button():
    """Add a 'Back to Home' button on each page."""
    if st.button("Back to Home"):
        st.session_state.page = "Home"

def login():
    """Function to handle user login."""
    st.markdown("<h1 style='text-align: center; color: #FFFFFF; font-family: Poppins, sans-serif;'>Currency Companion</h1>", unsafe_allow_html=True)
    st.markdown("<h2 style='text-align: center; color: #FFFFFF; font-family: Poppins, sans-serif;'>Login</h2>", unsafe_allow_html=True)

    username = st.text_input("Username", label_visibility="visible")
    password = st.text_input("Password", type="password", key="password", label_visibility="visible")


    if st.button("Login"):
        if username in users and users[username] == password:
            st.session_state.logged_in = True
            st.session_state.username = username
            st.session_state.balance = user_balance[username]
            st.success("Logged in successfully!")
        else:
            st.error("Invalid username or password!")

def show_home():
    """Function to display the banking dashboard after login."""
    st.markdown(f"<h1 style='text-align: center; color: #FFFFFF; font-family: Poppins, sans-serif;'>Welcome, {st.session_state.username}!</h1>", unsafe_allow_html=True)

    # Create buttons side by side for options (Accounts, Deposits, Payments, Balance)
    with st.container():
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            if st.button("Accounts"):
                st.session_state.page = "Accounts"
        with col2:
            if st.button("Deposits"):
                st.session_state.page = "Deposits"
        with col3:
            if st.button("Payments"):
                st.session_state.page = "Payments"
        with col4:
            if st.button("Balance"):
                st.session_state.page = "Balance"

def show_accounts():
    """Display accounts info."""
    st.markdown("<h2>Your Account Details</h2>", unsafe_allow_html=True)
    st.write("Here are your account details.")
    go_home_button()

def show_deposits():
    """Display deposit options."""
    st.markdown("<h2>Deposits</h2>", unsafe_allow_html=True)
    st.write("You can deposit money here.")
    go_home_button()

def payment_page():
    """Function to handle the payments."""
    st.markdown("<h2 style='text-align: center; color: #FFFFFF; font-family: Poppins, sans-serif;'>Payments</h2>", unsafe_allow_html=True)

    # Input recipient name
    recipient = st.text_input("Recipient Name", label_visibility="visible")
    
    # Choose mode of payment
   

    # Input amount for transaction
    transaction_amount = st.number_input("Enter amount to transfer", min_value=0, label_visibility="visible")

    if st.button("Make Payment"):
        if not recipient.strip():
            st.error("Recipient name cannot be empty!")
        elif transaction_amount > 0 and transaction_amount <= st.session_state.balance:
            st.session_state.balance -= transaction_amount
            st.success(f"Transferred ${transaction_amount} to {recipient}.")
            st.write(f"New balance: ${st.session_state.balance}")
        else:
            st.error("Insufficient balance or invalid amount!")
    go_home_button()

def show_balance():
    """Function to display the user's balance."""
    st.markdown("<h2 style='text-align: center; color: #FFFFFF; font-family: Poppins, sans-serif;'>Current Balance</h2>", unsafe_allow_html=True)
    st.write(f'<p class="balance-text">Your current balance: ${st.session_state.balance}</p>', unsafe_allow_html=True)
    go_home_button()

# Main execution
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False

if "page" not in st.session_state:
    st.session_state.page = "Home"

if "balance" not in st.session_state:
    st.session_state.balance = 0

if not st.session_state.logged_in:
    login()
elif st.session_state.page == "Home":
    show_home()
elif st.session_state.page == "Balance":
    show_balance()
elif st.session_state.page == "Accounts":
    show_accounts()
elif st.session_state.page == "Deposits":
    show_deposits()
elif st.session_state.page == "Payments":
    payment_page()
