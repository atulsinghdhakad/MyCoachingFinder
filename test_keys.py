from cryptography.fernet import Fernet
import base64
import hashlib

# Your encrypted message
encrypted_message = b'gAAAAABnbn8oO0O7Omqtqufcp6Nk5l4484KpgLs6aii8Kz2f_n2XP6Zb3IJfmxOO7iTu_AqYedOy9wpAKVOY5km7sqDJhTdzu2ZBldl8-vwunrvHaL602_ZOsON-koFbo9SUemw4scBmINBESZtjBBPycYI'

# Your JWT token
jwt_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiQXR1bCBTaW5naCBEaGFrYWQiLCJlbWFpbCI6ImF0dWxzaW5naGRoYWthZDE1QGdtYWlsLmNvbSIsImRhdGUiOiIyMDI1LTA2LTIwIDIwOjU4OjMwIn0.Qv7Qh4abfFm6Y4p8f4YUTU0AwVd4EG2jbjSr4Clm1CM'

# Generate hash-based keys
jwt_sha256 = hashlib.sha256(jwt_token.encode()).hexdigest()
jwt_md5 = hashlib.md5(jwt_token.encode()).hexdigest()
jwt_sha1 = hashlib.sha1(jwt_token.encode()).hexdigest()

# List of possible keys to try
possible_keys = [
    # Original keys
    b'n-WlVeBzL_oliR5MBwMGoXsCWkopUSxWCbjvHLtX8Wg=',
    b'00FC60FE3D7FEE66857B357017E4EBE65C',
    b'The Code Book',
    b'Mr.Crypto',
    b'LucioAI',
    b'lucioai',
    b'crypto',
    b'secret',
    b'key',
    
    # JWT related
    jwt_token.encode(),
    b'Qv7Qh4abfFm6Y4p8f4YUTU0AwVd4EG2jbjSr4Clm1CM',  # JWT signature
    b'eyJuYW1lIjoiQXR1bCBTaW5naCBEaGFrYWQiLCJlbWFpbCI6ImF0dWxzaW5naGRoYWthZDE1QGdtYWlsLmNvbSIsImRhdGUiOiIyMDI1LTA2LTIwIDIwOjU4OjMwIn0',  # JWT payload
    
    # Hash-based keys
    jwt_sha256.encode(),
    jwt_md5.encode(),
    jwt_sha1.encode(),
    
    # Personal info
    b'Atul Singh Dhakad',
    b'atulsinghdhakad15@gmail.com',
    b'2025-06-20 20:58:30',
    b'Atul',
    b'Dhakad',
    b'atul15',
    b'dhakad15',
    
    # Puzzle related
    b'show out your arm and take the entry stamp',
    b'entry stamp',
    b'arm stamp',
    b'show arm',
    b'take entry',
    b'bouncer',
    b'entry',
    b'stamp',
    b'arm',
    
    # Common words
    b'password',
    b'token',
    b'jwt',
    b'fernet',
    b'base64',
    b'decode',
    b'encode',
    b'welcome',
    b'hello',
    b'hi',
    b'congratulations',
    b'success',
    b'correct',
    b'right',
    b'yes',
    b'no',
    b'true',
    b'false',
    
    # Additional variations
    b'lucio',
    b'ai',
    b'job',
    b'application',
    b'interview',
    b'test',
    b'challenge',
    b'puzzle',
    b'solution',
    b'answer',
    b'correct',
    b'right',
    b'true',
    b'yes',
    b'no',
    b'maybe',
    b'get-started',
    b'getstarted',
    b'entry-stamp',
    b'entrystamp',
    b'show-arm',
    b'showarm',
    b'take-entry',
    b'takeentry',
    b'lucio.ai',
    b'lucio_ai',
    b'lucio-ai',
    b'mrcrypto',
    b'mr.crypto',
    b'mr crypto',
    b'mister crypto',
    b'mistercrypto',
    b'cryptography',
    b'encryption',
    b'decryption',
    b'secret',
    b'key',
    b'password',
    b'token',
    b'jwt',
    b'fernet',
    b'base64',
    b'decode',
    b'encode'
]

print("Testing keys for your encrypted message...")
print("=" * 50)

for key in possible_keys:
    try:
        if isinstance(key, str):
            key = key.encode()
        
        # Try to create a Fernet cipher with this key
        cipher = Fernet(key)
        
        # Try to decrypt
        decrypted = cipher.decrypt(encrypted_message)
        
        print(f"✅ SUCCESS with key: {key.decode() if isinstance(key, bytes) else key}")
        print(f"Decrypted message: {decrypted.decode()}")
        print("-" * 50)
        break
        
    except Exception as e:
        print(f"❌ Failed with key: {key.decode() if isinstance(key, bytes) else key}")

print("Finished testing all keys.") 