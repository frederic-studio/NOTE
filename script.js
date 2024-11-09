const noteContainer = document.getElementById('note');
const autocompleteTextarea = document.getElementById('autocomplete-textarea');
const typedSpan = document.querySelector('.typed');
const suggestionSpan = document.querySelector('.suggestion');

const commands = {
    Text: [
        {Name: "Display", Type: "h1", Placeholder: "Type to add a Display text"}, 
        {Name: "Headline", Type: "h2", Placeholder: "Type to add a Headline"}, 
        {Name: "Subtitle", Type: "h3", Placeholder: "Type to add a Subtitle"}, 
        {Name: "Paragraph", Type: "p", Placeholder: "Type to add a Paragraph"}
    ],
    List: [
        {Name: "Ordered", Type: "ol", Placeholder: "Type to add items to the Ordered list"},
        {Name: "Unordered", Type: "ul", Placeholder: "Type to add items to the Unordered list"},
        {Name: "Checklist", Type: "checklist", Placeholder: "Type to add items to the Checklist"}
    ],
    Object: [
        {Name: "Image", Type: "img", Placeholder: "Type or paste an image URL"}, 
        {Name: "Table", Type: "table", Placeholder: "Type to add content to the table"}, 
        {Name: "Link", Type: "a", Placeholder: "Type or paste a URL"}
    ]
};

let textInput = '';
let suggestionsList = [];
let currentSuggestionIndex = 0;
let currentMainCommand = '';
let isCommandComplete = false;
let currentType = 'p'; // Default type
let isCommandMode = false;
let checklistCounter = 1; // Counter for checklist IDs

// Track the current active list element
let activeListElement = null;

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
    const mainInput = textInput.slice(1);
    suggestionsList = getFilteredSuggestions(mainInput, commands);
    currentSuggestionIndex = 0;
    currentMainCommand = '';
    if (suggestionsList.length > 0) {
        currentMainCommand = suggestionsList[0];
    }
    updateSuggestionDisplay();
}

function handleSubSuggestions() {
    const subInput = textInput.split("/").pop();
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

function applyCommand(command) {
    const commandObj = commands[currentMainCommand].find(cmd => cmd.Name === command);
    if (commandObj) {
        // If switching to a different type, close any active list
        if (currentType !== commandObj.Type && activeListElement) {
            activeListElement = null;
        }
        
        currentType = commandObj.Type;
        autocompleteTextarea.placeholder = commandObj.Placeholder;
        autocompleteTextarea.value = '';
        resetSuggestions();
        isCommandMode = false;
    }
}

function createNoteElement(content) {
    if (currentType === 'img') {
        const img = document.createElement('img');
        img.src = content;
        img.alt = 'User added image';
        return img;
    } else if (currentType === 'a') {
        const link = document.createElement('a');
        link.href = content;
        link.textContent = content;
        link.target = '_blank';
        return link;
    } else if (currentType === 'checklist') {
        const form = document.createElement('form');
        form.className = 'checklist-form';
        
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        
        checkbox.type = 'checkbox';
        checkbox.id = `checkbox-${checklistCounter}`;
        checkbox.name = `checkbox-${checklistCounter}`;
        
        label.htmlFor = `checkbox-${checklistCounter}`;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(content));
        
        form.appendChild(label);
        checklistCounter++;
        
        return form;
    } else if (currentType === 'ol' || currentType === 'ul') {
        const li = document.createElement('li');
        li.textContent = content;
        
        // If there's no active list or the active list is of a different type
        if (!activeListElement || activeListElement.tagName.toLowerCase() !== currentType) {
            activeListElement = document.createElement(currentType);
            activeListElement.appendChild(li);
            return activeListElement;
        } else {
            // Add to existing list
            activeListElement.appendChild(li);
            return null;
        }
    } else {
        // For non-list elements, clear any active list
        activeListElement = null;
        const element = document.createElement(currentType);
        element.textContent = content;
        return element;
    }
}

autocompleteTextarea.addEventListener('input', (e) => {
    textInput = e.target.value;
    isCommandMode = textInput.startsWith('/');
    
    if (!textInput) {
        resetSuggestions();
        return;
    }
    
    if (isCommandMode) {
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
    } else if (e.key === 'Enter') {
        if (isCommandMode && suggestionsList.length > 0) {
            e.preventDefault();
            // Handle command selection
            if (textInput.split('/').length === 3) {
                const selectedSubCommand = suggestionsList[currentSuggestionIndex].Name;
                applyCommand(selectedSubCommand);
            }
        } else if (!isCommandMode && textInput.trim()) {
            e.preventDefault();
            // Handle content addition
            const noteElement = createNoteElement(textInput.trim());
            if (noteElement) { // Only append if there's a new element to add
                noteContainer.appendChild(noteElement);
            }
            autocompleteTextarea.value = '';
        }
    } else if (e.key === 'Tab' && suggestionsList.length > 0) {
        e.preventDefault();
        
        if (textInput.split('/').length === 2) {
            // Handle main command completion
            const selectedCommand = suggestionsList[currentSuggestionIndex];
            textInput = `/${selectedCommand}/`;
            currentMainCommand = selectedCommand;
            autocompleteTextarea.value = textInput;
            handleSubSuggestions();
        } else if (textInput.split('/').length === 3) {
            // Handle sub-command completion without applying it
            const selectedSubCommand = suggestionsList[currentSuggestionIndex].Name;
            textInput = `/${currentMainCommand}/${selectedSubCommand}`;
            autocompleteTextarea.value = textInput;
            updateSuggestionDisplay();
        }
    } else if (e.key === 'Escape') {
        // Close current list if escape is pressed
        activeListElement = null;
    }
});

// Clear the initial h1 placeholder
noteContainer.innerHTML = '';