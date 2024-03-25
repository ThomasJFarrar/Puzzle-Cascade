import json
import threading
from flask import Flask, render_template, request, session, jsonify
from skopt import gp_minimize

app = Flask(__name__, static_folder='static')
app.secret_key = 'key'

data = {}

def calculate_satisfaction(client_id):
    level_stats = data[client_id]['level_stats']

    leveltotaltime = level_stats['totaltime']
    levelmovetime = level_stats['avgmovetime']
    levelscorediff = level_stats['scorediff']
    levelshuffles = level_stats['shuffles']

    client_data = data[client_id]
    stats_list = client_data['stats']

    totaltotaltime = 0
    totalmovetime = 0
    totalscorediff = 0
    totalshufflesdiff = 0

    totaltimes = []
    movetimes = []
    scorediffs = []
    totalshuffles = []

    for stat in stats_list:
        totaltotaltime += stat['totaltime']
        totalmovetime += stat['avgmovetime']
        totalscorediff += stat['scorediff']
        totalshufflesdiff += stat['shuffles']

        totaltimes.append(stat['totaltime'])
        movetimes.append(stat['avgmovetime'])
        scorediffs.append(stat['scorediff'])
        totalshuffles.append(stat['shuffles'])

    # Calculate the averages of existing player stats
    avgtotaltime = totaltotaltime / len(stats_list)
    avgmovetime = totalmovetime / len(stats_list)
    avgscorediff = totalscorediff / len(stats_list)
    avgshuffles = totalshufflesdiff / len(stats_list)

    # Min max normalisation of avgs
    totaltimemin = min(totaltimes)
    movetimemin = min(movetimes)
    levelscoremin = min(scorediffs)
    shufflesmin = min(totalshuffles)

    totaltimemax = max(totaltimes)
    movetimemax = max(movetimes)
    levelscoremax = max(scorediffs)
    shufflesmax = max(totalshuffles)

    # Check to avoid dividing by 0
    if totaltimemax == totaltimemin:
        totaltimedeviation = 0
    elif movetimemax == movetimemin:
        movetimedeviation = 0
    elif levelscoremax == levelscoremin:
        scorediffdeviation = 0
    elif shufflesmax == shufflesmin:
        shuffledeviation = 0
    else:
        # Normalise
        totaltimeavgnormalised = (avgtotaltime - totaltimemin) / (totaltimemax - totaltimemin)
        movetimeavgnormalised = (avgmovetime - movetimemin) / (movetimemax - movetimemin)
        scorediffavgnormalised = (avgscorediff - levelscoremin) / (levelscoremax - levelscoremin)
        shufflediffavgnormalised = (avgshuffles - shufflesmin) / (shufflesmax - shufflesmin)
        leveltotaltimenormalised = (leveltotaltime - totaltimemin) / (totaltimemax - totaltimemin)
        levelmovetimenormalised = (levelmovetime - movetimemin) / (movetimemax - movetimemin)
        levelscorediffnormalised = (levelscorediff - levelscoremin) / (levelscoremax - levelscoremin)
        levelshufflediffnormalised = (levelshuffles - shufflesmin) / (shufflesmax - shufflesmin)
        

        totaltimedeviation = abs(totaltimeavgnormalised - leveltotaltimenormalised)
        movetimedeviation = abs(movetimeavgnormalised - levelmovetimenormalised)
        scorediffdeviation = abs(scorediffavgnormalised - levelscorediffnormalised)
        shuffledeviation = abs(shufflediffavgnormalised - levelshufflediffnormalised)

    avgdeviation = (totaltimedeviation + movetimedeviation + scorediffdeviation + shuffledeviation) / 4

    satisfaction = client_data['satisfaction']
    # Satisfaction calculation
    satisfaction = 1 - avgdeviation

    return satisfaction

def play(client_id):
    param_bounds = [(10, 20), (300, 900)]

    def objective_function(level_params):
        app.logger.info(str([int(i) for i in level_params]))
        # Make it so this sets the level paramers and starts the level
        data[client_id]['level_params'] = level_params
        data[client_id]['params_event'].set()
        data[client_id]['stats_event'].wait()
        data[client_id]['stats_event'].clear()
        if len(data[client_id]['stats']) <= 1:
            satisfaction = 1.0
        else:
            satisfaction = calculate_satisfaction(client_id)
        app.logger.info(str(1-satisfaction))
        return 1 - satisfaction

    def optimise():
        data[client_id]['level_stats'] = None

        result = gp_minimize(objective_function,
                             param_bounds,
                             n_calls=100,
                             random_state=42)
        return result

    result = optimise()

@app.route('/stats', methods=['POST'])
def receieve_stats():
    level_stats = request.json
    client_id = session.get('client_id')
    # Update the stats
    data[client_id]['stats'].append(level_stats)
    data[client_id]['level_stats'] = level_stats
    data[client_id]['stats_event'].set()
    if len(data[client_id]['stats']) <= 1:
        satisfaction = 1.0
    else:
        satisfaction = calculate_satisfaction(client_id)
    return jsonify(satisfaction)

@app.route('/get_level_params', methods=['GET'])
def get_level_params():
    client_id = session.get('client_id')
    data[client_id]['params_event'].wait()
    data[client_id]['params_event'].clear()
    level_params = data[client_id]['level_params']
    params = [int(i) for i in level_params]

    return json.dumps(params)

@app.route('/load', methods=['POST'])
def handle_load():
    client_id = session.get('client_id')
    if client_id not in data:
        data[client_id] = {'stats': [],
                           'level_stats': None,
                           'satisfaction': 0,
                           'level_params': [],
                           'stats_event': threading.Event(),
                           'params_event': threading.Event()}
    play(client_id)
    return jsonify('OK')

@app.route('/unload', methods=['POST'])
def handle_unload():
    client_id = session.get('client_id')
    # Remove client data
    if client_id in data:
        del data[client_id]
    return jsonify('OK')

@app.route('/')
def main():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
