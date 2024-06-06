# Adaptive Match-3 Game
## Introduction
This program has been developed for the ECM3401 Individual Literature Review and Project. It consists of an interactive Match-3 style computer game which aims to adapt aspects within the levels towards the player's preferences and play style, improving their satisfaction.
## Prerequisites
**Python 3.12.2** was used for the development of the system. To run the program, ensure you have the required libraries installed found in `requirements.txt`. You will need a compatible browser with JavaScript enabled to visit the web address and see the game, such as **Chrome Version 123.0.6312.123 (Official Build) (64-bit)** which was used during development.
## Getting Started
To get started with the program, run `app.py` which will start the flask server, then visit the url http://127.0.0.1:5000 in your browser.
### Starting the Game
You will be greeted immediately by the main menu. This offers a few different options. `Play` lets you play the game yourself, `Stupid Bot` runs the game playing as the stupid bot, and `Clever Bot` runs the game playing as the clever bot. The `Random mode` switches the levels to be randomly generated rather than using the adaptive system, and if you would like to change it back you can use the same button, `Adaptive mode`.
### Playing the Game
The objective of each level is to switch adjacent tiles to create rows of three, four, or five of the same colour. These award 30, 40 and 50 points respectively, and you will need to reach enough points to reach the target score in the limited moves you are given in the level. Swapping tiles consumes a move.

There are two special tiles that can generate. There is a chance that a tile can be black, this is an obstacle and cannot be swapped with any other tiles. There is a chance that a tile can also be white, this is a bonus. You can swap this with any colour tile for a free 100 points.

In each level there is a shuffle button. This regenerates the grid, but consumes a move in the process, so it is recommended only to use this when you are stuck.

After you beat a level, the next level button will appear to go to the next level. The overall aim is to reach the highest level as you can.
### Restarting
If you fail a level, the play again screen will appear and you will start again from level 1. If you would like to get back to the main menu, refresh the page.
