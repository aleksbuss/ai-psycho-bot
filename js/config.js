// ============================================
// ⚙️ CONFIG & GLOBALS
// ============================================
const GOOGLE_SCRIPT_URL = "https://bez-paniki-api.aleksbuss.workers.dev/api";

window.onerror = function(msg, url, line) {
   document.getElementById('error-console').style.display='block';
   document.getElementById('error-console').innerHTML += msg + ' (line ' + line + ')<br>';
   return false;
};

const tg = window.Telegram.WebApp; 
tg.expand();
const userId = tg.initDataUnsafe?.user?.id || 'test_' + Math.floor(Math.random()*1000);
const userName = tg.initDataUnsafe?.user?.first_name || 'Друг';
const botUsername = tg.initDataUnsafe?.bot?.username || 'LastAIPanicBot';

window.isUserPremium = false;
let soundsEnabled = localStorage.getItem('sounds_enabled') !== 'false';
let messageCount = parseInt(localStorage.getItem('message_count') || '0');
let selectedMoodLevel = null;
let _requiredChannel = '';
