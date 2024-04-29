import json
import threading
import matplotlib.pyplot as plt
from flask import Flask, render_template, request, jsonify
from skopt import gp_minimize

app = Flask(__name__, static_folder='static')
app.secret_key = 'key'

MINPOSSIBLEMOVES = 10
MAXPOSSIBLEMOVES = 20
MINTARGETSCORE = 200
MAXTARGETSCORE = 800
MINOBSTACLECHANCE = 25
MAXOBSTACLECHANCE = 75
MINBONUSCHANCE = 50
MAXBONUSCHANCE = 200

data = {}

def calculate_satisfaction():
    previous_level_stats = data['stats']

    avgmovetimescore = calculate_avgmovetime_score(previous_level_stats)
    scorediffscore = calculate_scorediff_score(previous_level_stats)
    shufflescore = calculate_shuffle_score(previous_level_stats)
    combinationsscore = calculate_combinations_score(previous_level_stats)

    app.logger.info("avgtimescore: " + str(avgmovetimescore))
    app.logger.info("scorediffscore: " + str(scorediffscore))
    app.logger.info("shufflescore: " + str(shufflescore))
    app.logger.info("combinationsscore: " + str(combinationsscore))

    combined_score = (avgmovetimescore + scorediffscore + shufflescore + combinationsscore) / 4

    satisfaction_score = data['satisfaction']

    if combined_score < 0.1:
        if satisfaction_score < 1:
            satisfaction_score += 0.02
    elif combined_score < 0.2:
        pass
    else:
        if satisfaction_score > 0:
            satisfaction_score -= 0.02

    satisfaction_score = round(satisfaction_score, 2) # Round for floating point numbers
    return satisfaction_score

def calculate_avgmovetime_score(previous_level_stats):
    previous_avgmovetimes = []

    # Extract the previous avgmovetimes
    for stat in previous_level_stats:
        previous_avgmovetimes.append(stat['avgmovetime'])

    # Calculate the average of all the previous avgmovetimes
    totalavgmovetimes = sum(previous_avgmovetimes)
    avg_previous_avgmovetimes = totalavgmovetimes / len(previous_avgmovetimes)

    # Min Max Normalisation of previous avg of avgmovetimes and current avgmovetime
    max_previous_avgmovetime = max(previous_avgmovetimes)
    min_previous_avgmovetime = min(previous_avgmovetimes)
    current_level_avgmovetime = data['level_stats']['avgmovetime']

    # Check to stop division by 0
    if max_previous_avgmovetime != min_previous_avgmovetime:
        normalised_previous = (avg_previous_avgmovetimes - min_previous_avgmovetime) \
                            / (max_previous_avgmovetime - min_previous_avgmovetime)
        normalised_current = (current_level_avgmovetime - min_previous_avgmovetime) \
                            / (max_previous_avgmovetime - min_previous_avgmovetime)

        # Calculate deviation betwen current and previous averged
        avgmovetime_deviation = abs(normalised_current - normalised_previous)
    else:
        avgmovetime_deviation = 0

    return avgmovetime_deviation

def calculate_scorediff_score(previous_level_stats):
    previous_scorediffs = []

    # Extract the previous scorediffs
    for stat in previous_level_stats:
        previous_scorediffs.append(stat['scorediff'])

    # Min Max Normalisation of current scorediff
    max_previous_scorediff = max(previous_scorediffs)
    min_previous_scorediff = min(previous_scorediffs)
    current_level_scorediff = data['level_stats']['scorediff']

    if max_previous_scorediff != min_previous_scorediff:
        normalised_current = (current_level_scorediff - min_previous_scorediff) \
                           / (max_previous_scorediff - min_previous_scorediff)
    else:
        normalised_current = 0

    return normalised_current

def calculate_shuffle_score(previous_level_stats):
    previous_shuffles = []

    # Extract the previous shuffles
    for stat in previous_level_stats:
        previous_shuffles.append(stat['shuffles'])

    # Min Max Normalisation of current shuffles
    max_previous_shuffle = max(previous_shuffles)
    min_previous_shuffle = min(previous_shuffles)
    current_level_shuffle = data['level_stats']['shuffles']

    if max_previous_shuffle != min_previous_shuffle:
        normalised_current = (current_level_shuffle - min_previous_shuffle) \
                           / (max_previous_shuffle - min_previous_shuffle)
    else:
        normalised_current = 0

    return normalised_current

def calculate_combinations_score(previous_level_stats):
    previous_fives = []
    previous_fours = []
    previous_threes = []

    # Extract the previous five, four and three combinations
    for stat in previous_level_stats:
        previous_fives.append(stat['fives'])
        previous_fours.append(stat['fours'])
        previous_threes.append(stat['threes'])

    # Calculate the average of all the previous five, four and three combinations
    totalfives = sum(previous_fives)
    totalfours = sum(previous_fours)
    totalthrees = sum(previous_threes)
    avg_previous_fives = totalfives / len(previous_fives)
    avg_previous_fours = totalfours / len(previous_fours)
    avg_previous_threes = totalthrees / len(previous_threes)

    # Min Max Normalisation of previous avg of combinations and current combinations
    max_previous_fives = max(previous_fives)
    min_previous_fives = min(previous_fives)
    current_level_fives = data['level_stats']['fives']

    max_previous_fours = max(previous_fours )
    min_previous_fours  = min(previous_fours )
    current_level_fours = data['level_stats']['fours']

    max_previous_threes = max(previous_threes)
    min_previous_threes  = min(previous_threes)
    current_level_threes = data['level_stats']['threes']

    # Check to stop division by 0
    if max_previous_fives != min_previous_fives:
        normalised_previous = (avg_previous_fives - min_previous_fives) \
                            / (max_previous_fives - min_previous_fives)
        normalised_current = (current_level_fives- min_previous_fives) \
                            / (max_previous_fives - min_previous_fives)

        # Calculate deviation betwen current and previous averged
        fives_deviation = abs(normalised_current - normalised_previous)
    else:
        fives_deviation = 0

    if max_previous_fours != min_previous_fours:
        normalised_previous = (avg_previous_fours - min_previous_fours) \
                            / (max_previous_fours - min_previous_fours)
        normalised_current = (current_level_fours- min_previous_fours) \
                            / (max_previous_fours - min_previous_fours)

        # Calculate deviation betwen current and previous averged
        fours_deviation = abs(normalised_current - normalised_previous)
    else:
        fours_deviation = 0

    if max_previous_threes != min_previous_threes:
        normalised_previous = (avg_previous_threes - min_previous_threes) \
                            / (max_previous_threes - min_previous_threes)
        normalised_current = (current_level_threes- min_previous_threes) \
                            / (max_previous_threes - min_previous_threes)

        # Calculate deviation betwen current and previous averged
        threes_deviation = abs(normalised_current - normalised_previous)
    else:
        threes_deviation = 0

    combinations_deviation = (fives_deviation + fours_deviation + threes_deviation) / 3

    return combinations_deviation

def play():
    param_bounds = [(MINPOSSIBLEMOVES, MAXPOSSIBLEMOVES),
                    (MINTARGETSCORE, MAXTARGETSCORE),
                    (MINOBSTACLECHANCE, MAXOBSTACLECHANCE),
                    (MINBONUSCHANCE, MAXBONUSCHANCE)]

    def objective_function(level_params):
        app.logger.info("Level Params: " + str([int(i) for i in level_params]))
        data['level_params'] = level_params
        data['params_event'].set()
        data['stats_event'].wait()
        data['stats_event'].clear()
        satisfaction = calculate_satisfaction()
        data['satisfaction'] = satisfaction
        app.logger.info("Satisfaction Score: " + str(satisfaction))
        data['satisfaction_scores'].append(satisfaction)
        return 1 - satisfaction

    def optimise():
        data['level_stats'] = None

        result = gp_minimize(objective_function,
                             param_bounds,
                             n_calls=100,
                             random_state=42)
        return result

    result = optimise()
    plt.plot(range(len(data['satisfaction_scores'])), data['satisfaction_scores'], marker='o')
    plt.xlabel('Iteration')
    plt.ylabel('Satisfaction Score')
    plt.title('Satisfaction Scores vs Iteration')
    plt.grid(True)
    plt.ylim(0, 1)
    plt.savefig('satisfaction_scores.png')

@app.route('/stats', methods=['POST'])
def receieve_stats():
    level_stats = request.json
    # Update the stats
    data['stats'].append(level_stats)
    data['level_stats'] = level_stats
    data['stats_event'].set()
    return jsonify("OK")

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
            'satisfaction': 0.5,
            'satisfaction_scores': [],
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
