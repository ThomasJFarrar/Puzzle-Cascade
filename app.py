import json
import threading
from flask import Flask, render_template, request, jsonify
from skopt import gp_minimize

app = Flask(__name__, static_folder='static')
app.secret_key = 'key'

MINPOSSIBLEMOVES = 10
MAXPOSSIBLEMOVES = 15
MINTARGETSCORE = 100
MAXTARGETSCORE = 300

data = {}

def calculate_satisfaction(data):

    averages = average_stats(data['stats'])
    normalised_stats = normalise_stats(averages, data['stats'], data['level_stats'])
    avg_deviation = calculate_deviation(normalised_stats[0], normalised_stats[1])
    satisfaction = 1 - avg_deviation

    return satisfaction

def average_stats(stats_list):
    totaltotaltime = 0
    totalmovetime = 0
    totalscorediff = 0
    totalshufflesdiff = 0

    for stat in stats_list:
        totaltotaltime += stat['totaltime']
        totalmovetime += stat['avgmovetime']
        totalscorediff += stat['scorediff']
        totalshufflesdiff += stat['shuffles']

    # Calculate the averages of existing player stats
    avgtotaltime = totaltotaltime / len(stats_list)
    avgmovetime = totalmovetime / len(stats_list)
    avgscorediff = totalscorediff / len(stats_list)
    avgshuffles = totalshufflesdiff / len(stats_list)

    return avgtotaltime, avgmovetime, avgscorediff, avgshuffles

def normalise_stats(averages, stats_list, level_stats):
    totaltimes = []
    movetimes = []
    scorediffs = []
    totalshuffles = []

    leveltotaltime = level_stats['totaltime']
    levelmovetime = level_stats['avgmovetime']
    levelscorediff = level_stats['scorediff']
    levelshuffles = level_stats['shuffles']

    avgtotaltime = averages[0]
    avgmovetime = averages[1]
    avgscorediff = averages[2]
    avgshuffles = averages[3]

    for stat in stats_list:
        totaltimes.append(stat['totaltime'])
        movetimes.append(stat['avgmovetime'])
        scorediffs.append(stat['scorediff'])
        totalshuffles.append(stat['shuffles'])

    totaltimemin = min(totaltimes)
    movetimemin = min(movetimes)
    levelscoremin = min(scorediffs)
    shufflesmin = min(totalshuffles)

    totaltimemax = max(totaltimes)
    movetimemax = max(movetimes)
    levelscoremax = max(scorediffs)
    shufflesmax = max(totalshuffles)

    # Check if values are the same to avoid division by zero
    if totaltimemin == totaltimemax:
        totaltimeavgnormalised = 0
        leveltotaltimenormalised = 0
    else:
        totaltimeavgnormalised = (avgtotaltime - totaltimemin) / (totaltimemax - totaltimemin)
        leveltotaltimenormalised = (leveltotaltime - totaltimemin) / (totaltimemax - totaltimemin)
    if movetimemin == movetimemax:
        movetimeavgnormalised = 0
        levelmovetimenormalised = 0
    else:
        movetimeavgnormalised = (avgmovetime - movetimemin) / (movetimemax - movetimemin)
        levelmovetimenormalised = (levelmovetime - movetimemin) / (movetimemax - movetimemin)
    if levelscoremin == levelscoremax:
        scorediffavgnormalised = 0
        levelscorediffnormalised = 0
    else:
        scorediffavgnormalised = (avgscorediff - levelscoremin) / (levelscoremax - levelscoremin)
        levelscorediffnormalised = (levelscorediff - levelscoremin) / (levelscoremax - levelscoremin)
    if shufflesmin == shufflesmax:
        shufflediffavgnormalised = 0
        levelshufflediffnormalised = 0
    else:
        shufflediffavgnormalised = (avgshuffles - shufflesmin) / (shufflesmax - shufflesmin)
        levelshufflediffnormalised = (levelshuffles - shufflesmin) / (shufflesmax - shufflesmin)

    return (totaltimeavgnormalised,
            movetimeavgnormalised,
            scorediffavgnormalised,
            shufflediffavgnormalised), \
           (leveltotaltimenormalised,
            levelmovetimenormalised,
            levelscorediffnormalised,
            levelshufflediffnormalised)

def calculate_deviation(stats_normalised, level_stats_normalised):

    totaltimedeviation = abs(stats_normalised[0] - level_stats_normalised[0])
    movetimedeviation = abs(stats_normalised[1] - level_stats_normalised[1])
    scorediffdeviation = abs(stats_normalised[2] - level_stats_normalised[2])
    shuffledeviation = abs(stats_normalised[3] - level_stats_normalised[3])

    avgdeviation = (totaltimedeviation + movetimedeviation + \
                    scorediffdeviation + shuffledeviation) / 4

    return avgdeviation

def play():
    param_bounds = [(MINPOSSIBLEMOVES, MAXPOSSIBLEMOVES),
                    (MINTARGETSCORE, MAXTARGETSCORE)]

    def objective_function(level_params):
        app.logger.info(str([int(i) for i in level_params]))
        data['level_params'] = level_params
        data['params_event'].set()
        data['stats_event'].wait()
        data['stats_event'].clear()
        if len(data['stats']) <= 1:
            satisfaction = 1.0
        else:
            satisfaction = calculate_satisfaction(data)
        app.logger.info(str(1-satisfaction))
        return 1 - satisfaction

    def optimise():
        data['level_stats'] = None

        result = gp_minimize(objective_function,
                             param_bounds,
                             n_calls=100,
                             random_state=42)
        return result

    result = optimise()

@app.route('/stats', methods=['POST'])
def receieve_stats():
    level_stats = request.json
    # Update the stats
    data['stats'].append(level_stats)
    data['level_stats'] = level_stats
    data['stats_event'].set()
    if len(data['stats']) <= 1:
        satisfaction = 1.0
    else:
        satisfaction = calculate_satisfaction(data)
    return jsonify(satisfaction)

@app.route('/get_level_params', methods=['GET'])
def get_level_params():
    data['params_event'].wait()
    data['params_event'].clear()
    level_params = data['level_params']
    params = [int(i) for i in level_params]
    return json.dumps(params)

@app.route('/load', methods=['POST'])
def handle_load():
    # Add default data.
    data.update({'stats': [],
            'level_stats': None,
            'satisfaction': 0,
            'level_params': [],
            'stats_event': threading.Event(),
            'params_event': threading.Event()
            })
    play()
    return jsonify("OK")

@app.route('/unload', methods=['POST'])
def handle_unload():
    # Remove data.
    data.clear()
    return jsonify('OK')

@app.route('/')
def main():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
