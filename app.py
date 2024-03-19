from flask import Flask, render_template, request, session, jsonify

app = Flask(__name__, static_folder='static')
app.secret_key = 'key'

data = {}

def calculate_satisfaction(client_id, level_stats):
    leveltotaltime = level_stats['totaltime']
    levelmovetime = level_stats['avgmovetime']
    levelscorediff = level_stats['scorediff']

    client_data = data[client_id]
    stats_list = client_data['stats']

    totaltotaltime = 0
    totalmovetime = 0
    totalscorediff = 0
    
    totaltimes = []
    movetimes = []
    scorediffs = []

    for stat in stats_list:
        totaltotaltime += stat['totaltime']
        totalmovetime += stat['avgmovetime']
        totalscorediff += stat['scorediff']

        totaltimes.append(stat['totaltime'])
        movetimes.append(stat['avgmovetime'])
        scorediffs.append(stat['scorediff'])
        
    # Calculate the averages of existing player stats
    avgtotaltime = totaltotaltime / len(stats_list)
    avgmovetime = totalmovetime / len(stats_list)
    avgscorediff = totalscorediff / len(stats_list)
    
    # Min max normalisation of avgs
    totaltimemin = min(totaltimes)
    movetimemin = min(movetimes)
    levelscoremin = min(scorediffs)
    
    totaltimemax = max(totaltimes)
    movetimemax = max(movetimes)
    levelscoremax = max(scorediffs)

    totaltimeavgnormalised = (avgtotaltime - totaltimemin) / (totaltimemax - totaltimemin)
    movetimeavgnormalised = (avgmovetime - movetimemin) / (movetimemax - movetimemin)
    scorediffavgnormalised = (avgscorediff - levelscoremin) / (levelscoremax - levelscoremin)
    leveltotaltimenormalised = (leveltotaltime - totaltimemin) / (totaltimemax - totaltimemin)
    levelmovetimenormalised = (levelmovetime - movetimemin) / (movetimemax - movetimemin)
    levelscorediffnormalised = (levelscorediff - levelscoremin) / (levelscoremax - levelscoremin)

    satisfaction = client_data['satisfaction']
    
    totaltimedeviation = abs(totaltimeavgnormalised - leveltotaltimenormalised)
    movetimedeviation = abs(movetimeavgnormalised - levelmovetimenormalised)
    scorediffdeviation = abs(scorediffavgnormalised - levelscorediffnormalised)
    
    avgdeviation = (totaltimedeviation + movetimedeviation + scorediffdeviation) / 3
    
    # Satisfaction calculation (to change later)
    satisfaction = 1 - avgdeviation

    return satisfaction

def optimise(client_id):
    parameters = []
    return parameters

@app.route('/stats', methods=['POST'])
def receive_json():
    level_stats = request.json
    client_id = session.get('client_id')
    # Initialise new client
    if client_id not in data:
        data[client_id] = {'stats': [], 'satisfaction': 1.0}
    # Update the stats
    if len(data[client_id]['stats']) != 5:
        data[client_id]['stats'].append(level_stats)
        return jsonify(level_stats)
    else:
        satisfaction = calculate_satisfaction(client_id, level_stats)
        data[client_id]['satisfaction'] = satisfaction
        #level_parameters = optimise(client_id)
        #return jsonify(level_parameters)
        return jsonify(satisfaction)

@app.route('/unload', methods=['POST'])
def handle_unload():
    client_id = session.get('client_id')
    # Remove client data
    if client_id in data:
        del data[client_id]
    return 'OK'

@app.route('/')
def main():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
