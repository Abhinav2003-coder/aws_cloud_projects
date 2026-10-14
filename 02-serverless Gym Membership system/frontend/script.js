// ==========================================
// STEP 1: AWS CONFIGURATION (Address Book)
// ==========================================
const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: 'us-east-1_iYGCu8VDx', 
            userPoolClientId: '6ap783g60etjn93u9md8co394g' // Fixed: Changed key name for Amplify standard
        }
    }
};

// Amplify library ko initialize karna
Amplify.configure(awsConfig); // Fixed: Removed .default

// API Gateway ka Invoke URL
const API_URL = "https://ggo6vuujo3.execute-api.us-east-1.amazonaws.com/dev/member";


// ==========================================
// STEP 2: USER SIGNUP (Naya Account Banana)
// ==========================================
async function signUpUser() {
    const userEmail = document.getElementById('email').value;
    const userPassword = document.getElementById('password').value;

    if (!userEmail || !userPassword) {
        alert("Please fill in both Email and Password fields.");
        return;
    }

    try {
        // Cognito me user register karna
        await Amplify.Auth.signUp({
            username: userEmail,
            password: userPassword,
            options: {
                userAttributes: {
                    email: userEmail // Fixed: Wrapped inside options.userAttributes
                }
            }
        });
        
        alert("Signup successful! Aapke email par ek verification code gaya hai.");
    } catch (error) {
        alert("Oops! Account nahi bana: " + error.message);
    }
}


// ==========================================
// STEP 3: USER SIGNIN (Login Karna)
// ==========================================
async function signInUser() {
    const userEmail = document.getElementById('email').value;
    const userPassword = document.getElementById('password').value;

    if (!userEmail || !userPassword) {
        alert("Please fill in both Email and Password fields.");
        return;
    }

    try {
        // Cognito se login check karna
        await Amplify.Auth.signIn({ username: userEmail, password: userPassword });
        alert("Waah! Login ho gaya.");
        
        // Login form ko chhupana aur Dashboard ko samne dikhana
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        
        // Screen par User ID show karna (Email hi hamari ID hai)
        document.getElementById('lbl-userid').innerText = userEmail;
        
        // Login hote hi backend se membership status check karna
        checkMembership(userEmail); // Fixed: Passed userEmail directly to avoid username bugs

    } catch (error) {
        alert("Login failed! Email ya password galat hai: " + error.message);
    }
}


// ==========================================
// STEP 4: DATABASE FETCH (API Gateway Call)
// ==========================================
async function checkMembership(userId) {
    try {
        document.getElementById('lbl-status').innerText = "Loading...";

        // API Gateway par GET request bhejna query parameter (?userId=...) ke sath
        const response = await fetch(`${API_URL}?userId=${encodeURIComponent(userId)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        // Agar database me data mil gaya
        if (response.status === 200) {
            const data = await response.json();
            // Screen par ACTIVE / INACTIVE status dikhana
            document.getElementById('lbl-status').innerText = data.membershipStatus; 
        } 
        // Agar user pehli baar aya hai aur database me nahi mila
        else if (response.status === 404) {
            document.getElementById('lbl-status').innerText = "Account mila par profile complete nahi hai.";
        }
    } catch (error) {
        console.error("Backend se baat nahi ho payi:", error);
        document.getElementById('lbl-status').innerText = "Error! Server down hai.";
    }
}

// extra code
async function registerMember() {
  try {
    const response = await fetch('https://api.example.com/register', {
      method: 'POST',
      body: JSON.stringify({ /* data */ }),
      headers: { 'Content-Type': 'application/json' }
    });

    // fetch only throws on network failure; check response.ok for HTTP errors
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Success:', data);
  } catch (error) {
    // This catches "Failed to fetch" AND the custom HTTP error above
    console.error("Fetch Error:", error.message);
  }
}