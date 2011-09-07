# Soda

Soda is a replacement course browser for Brown University. The system at Brown is called Banner and has a terrible search interface. There is essentially a widget for every field in the course database. Besides being cumbersome, the system is also slow and mistakes cost the user time as the request bounces back from the server. This delay is especially bad around the start of the semester when all students at Brown are using the system to schedule their courses.

Soda fixes all this. The entire list of current courses is downloaded to the browser once at page load time, after which the entire app runs client-side. While this is a higher initial load, the common usage pattern is relatively long periods of scheduling where a client-side app like Soda actually saves in data transfer. In addition, the entire list of courses can be gzipped and cached by the browser, so the actual data transfer overhead isn't bad at all.

Searches are performed instantly as the user types. There is only one search textbox, which can search titles, departments, professors, buildings, and other metadata and contains some extra smarts to pick out common course abbreviations in use around the campus. There are several shortcomings however: Soda currently has no way of scraping textbook info, and Soda may be slightly out of date since its data represents a snapshot of Banner in the past.

## Installation

To get soda up and running, just clone this repo and paste this line into a terminal:

    cd courses && python courses.py && cd .. && python build.py release && python server.py

This will download a list of courses from https://github.com/evanw/banner, compile the course information, and serve soda on http://localhost:8000/. If you would like to get an up-to-date version of the current courses, you can also clone the banner repo and perform the scraping yourself. In that case, make sure to copy the scraped file `banner.pickle` to `./courses/` before running `courses.py`.
