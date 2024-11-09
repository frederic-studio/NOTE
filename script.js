const autocompleteTextarea = document.getElementById('autocomplete-textarea');
const typedSpan = document.querySelector('.typed');
const suggestionSpan = document.querySelector('.suggestion');

const commands = {
    Text: [
        {Name: "Display", Type: "H1"}, 
        {Name: "Headline", Type: "H2"}, 
        {Name: "Subtitle", Type: "H3"}, 
        {Name: "Paragraph", Type: "p"}
    ],
    List: [
        {Name: "Ordered", Type: "OL"},
        {Name: "Unordered", Type: "UL"},
        {Name: "Checklist", Type: "input type=checkbox"}
    ],
    Object: [
        {Name: "Image", Type: "img"},
        {Name: "Table", Type: "tb"}, 
        {Name: "Link", Type: "a"}
    ]
};

let textInput = '';
let suggestionsList = [];
let currentSuggestionIndex = 0;
let currentMainCommand = '';
let isCommandComplete = false;

function getFilteredSuggestions(input, commandList) {
    return Object.keys(commandList).filter(cmd => cmd.toLowerCase().startsWith(input.toLowerCase())).sort();
}

function updateSuggestionDisplay() {
    const typedText = textInput;
    let suggestionText = '';
    
    if (suggestionsList.length > 0) {
        suggestionText = typeof suggestionsList[currentSuggestionIndex] === 'string' 
            ? suggestionsList[currentSuggestionIndex]
            : suggestionsList[currentSuggestionIndex].Name;
    }

    // Only show the part of suggestion that has not been typed
    const remainingSuggestion = suggestionText.slice(typedText.split("/").pop().length);

    typedSpan.textContent = textInput;
    suggestionSpan.textContent = remainingSuggestion;
}

function resetSuggestions() {
    currentSuggestionIndex = 0;
    suggestionsList = [];
    typedSpan.textContent = '';
    suggestionSpan.textContent = '';
    isCommandComplete = false;
}

function handleMainSuggestions() {
    const mainInput = textInput.slice(1); // Text after "/"
    suggestionsList = getFilteredSuggestions(mainInput, commands);
    currentSuggestionIndex = 0;
    currentMainCommand = '';
    if (suggestionsList.length > 0) {
        currentMainCommand = suggestionsList[0];
    }
    updateSuggestionDisplay();
}

function handleSubSuggestions() {
    const subInput = textInput.split("/").pop(); // Get text after last "/"
    const mainCommand = textInput.split("/")[1];
    if (commands[mainCommand]) {
        currentMainCommand = mainCommand;
        suggestionsList = commands[mainCommand].filter(
            sub => sub.Name.toLowerCase().startsWith(subInput.toLowerCase())
        );
        currentSuggestionIndex = 0;
        updateSuggestionDisplay();
    }
}

function logCommandType() {
    const sections = textInput.trim().split('/');
    if (sections.length === 3 && currentMainCommand) {
        const subCommand = sections[2].trim();
        const commandObj = commands[currentMainCommand].find(
            cmd => cmd.Name.toLowerCase() === subCommand.toLowerCase()
        );
        if (commandObj) {
            console.log('Command Type:', commandObj.Type);
            isCommandComplete = true;
        }
    }
}

autocompleteTextarea.addEventListener('input', (e) => {
    textInput = e.target.value;
    isCommandComplete = false;
    
    // Clear suggestions if textarea is empty
    if (!textInput || textInput === '') {
        resetSuggestions();
        return;
    }
    
    if (textInput.startsWith('/')) {
        const sections = textInput.split('/');
        if (sections.length === 2) {
            handleMainSuggestions();
        } else if (sections.length === 3) {
            handleSubSuggestions();
        } else {
            resetSuggestions();
        }
    } else {
        resetSuggestions();
    }
});

autocompleteTextarea.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && suggestionsList.length > 0) {
        e.preventDefault();
        currentSuggestionIndex = (currentSuggestionIndex + 1) % suggestionsList.length;
        updateSuggestionDisplay();
    } else if (e.key === 'ArrowUp' && suggestionsList.length > 0) {
        e.preventDefault();
        currentSuggestionIndex = (currentSuggestionIndex - 1 + suggestionsList.length) % suggestionsList.length;
        updateSuggestionDisplay();
    } else if (e.key === 'Tab' && suggestionsList.length > 0 && !isCommandComplete) {
        e.preventDefault();
        
        if (textInput.split('/').length === 2) {
            // Handle main command completion
            const selectedCommand = suggestionsList[currentSuggestionIndex];
            textInput = `/${selectedCommand}/`;
            currentMainCommand = selectedCommand;
            autocompleteTextarea.value = textInput;
            handleSubSuggestions();  // Immediately show sub-suggestions
        } else {
            // Handle sub-command completion
            const selectedSubCommand = suggestionsList[currentSuggestionIndex].Name;
            textInput = `/${currentMainCommand}/${selectedSubCommand}`;
            autocompleteTextarea.value = textInput;
            logCommandType();
            resetSuggestions();
        }
    }
});