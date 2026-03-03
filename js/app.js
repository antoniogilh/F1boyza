/**
 * F1 BOYZA - Main Application Entry Point
 */
import { initNavigation }  from './modules/navigation.js';
import { initSlider }      from './modules/slider.js';
import { initCountdown }   from './modules/countdown.js';
import { initHomepage }    from './modules/homepage.js';
import { initCalendar }    from './modules/calendar.js';
import { initDates }       from './modules/dates.js';
import { initResults }     from './modules/results.js';
import { initHeadToHead }  from './modules/headtohead.js';
import { initPenalties }   from './modules/penalties.js';
import { initWheel }       from './modules/wheel.js';

import '../css/style.css';

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCountdown();
  initSlider();
  initHomepage();
  initCalendar();
  initDates();
  initResults();
  initHeadToHead();
  initPenalties();
  initWheel();
});
