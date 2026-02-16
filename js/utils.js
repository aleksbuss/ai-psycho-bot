// 📝 MARKDOWN MINI-PARSER
// ============================================
function parseMd(text) {
    if (!text) return '';
    let html = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^[\-\•]\s+(.+)/gm, '<li>$1</li>')
        .replace(/^\d+\.\s+(.+)/gm, '<li>$1</li>')
        .replace(/\n/g, '<br>');
    html = html.replace(/((?:<li>.*?<\/li><br>?)+)/g, '<ul>$1</ul>');
    html = html.replace(/<br><\/ul>/g, '</ul>').replace(/<ul><br>/g, '<ul>');
    return html;
}

// ============================================
// ⌨️ TYPEWRITER EFFECT
// ============================================
function typewriterEffect(element, html, callback) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const plainText = temp.textContent || temp.innerText;
    const words = plainText.split(' ');
    let i = 0;
    element.innerHTML = '';
    
    function typeNextWord() {
        if (i >= words.length) {
            element.innerHTML = html; // Final: render full HTML with formatting
            if (callback) callback();
            return;
        }
        element.textContent += (i > 0 ? ' ' : '') + words[i];
        i++;
        scrollToBottom();
        setTimeout(typeNextWord, 30 + Math.random() * 20);
    }
    typeNextWord();
}

// ============================================
