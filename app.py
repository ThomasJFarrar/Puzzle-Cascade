from flask import Flask, render_template, request, session, jsonify
import uuid

app = Flask(__name__, static_folder='static')
app.secret_key = 'key'

data = {}

def optimise(data):
    pass

@app.route('/stats', methods=['POST'])
def receive_json():
    stats = request.json
    client_id = session.get('client_id')
    if client_id is None:
        client_id = str(uuid.uuid4())
        session['client_id'] = client_id
        data[client_id] = {}
    optimise(data)
    return jsonify({"message": "JSON received successfully"})

@app.route('/')
def main():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
