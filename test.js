const noteContainer = document.getElementById('note');
const autocompleteTextarea = document.getElementById('autocomplete-textarea');
const commandInput = document.getElementById('cool');
const typedSpan = document.querySelector('.typed');
const suggestionSpan = document.querySelector('.suggestion');
const suggestionContainer = suggestionSpan.parentElement;
const commandTypedSpan = document.querySelector('#autocomplete span .typed');
const commandSuggestionSpan = document.querySelector('#autocomplete span .suggestion');

const commands = {
    Text: [
        {Name: "Display", Type: "h1", Placeholder: "Type to add a Display"}, 
        {Name: "Headline", Type: "h2", Placeholder: "Type to add a Headline"}, 
        {Name: "Subtitle", Type: "h3", Placeholder: "Type to add a Subtitle"}, 
        {Name: "Paragraph", Type: "p", Placeholder: "Type to add a Paragraph"}
    ],
    List: [
        {Name: "Ordered", Type: "ol", Placeholder: "Type to add list item"},
        {Name: "Unordered", Type: "ul", Placeholder: "Type to add list item"},
        {Name: "Checklist", Type: "checklist", Placeholder: "Type to add list item"}
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
let currentType = 'p';
let isCommandMode = false;
let checklistCounter = 1;
let activeListElement = null;
let activeFormElement = null;
let olCounter = 1;

function switchToCommandMode() {
    commandInput.value = '/';
    commandInput.focus();
    commandInput.setSelectionRange(1, 1);
    handleMainSuggestions();
    isCommandMode = true;
}

function switchToTextMode() {
    autocompleteTextarea.focus();
    isCommandMode = false;
    resetSuggestions();
}

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
    
    if (isCommandMode) {
        commandTypedSpan.textContent = typedText;
        commandSuggestionSpan.textContent = remainingSuggestion;
    } else {
        typedSpan.textContent = typedText;
        suggestionSpan.textContent = remainingSuggestion;
    }
}

function resetSuggestions() {
    currentSuggestionIndex = 0;
    suggestionsList = [];
    typedSpan.textContent = '';
    suggestionSpan.textContent = '';
    commandTypedSpan.textContent = '';
    commandSuggestionSpan.textContent = '';
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
        if (currentType !== commandObj.Type) {
            if (currentType !== 'checklist') {
                activeFormElement = null;
            }
            if (activeListElement) {
                activeListElement = null;
            }
        }

        currentType = commandObj.Type;
        autocompleteTextarea.placeholder = commandObj.Placeholder;
        autocompleteTextarea.value = '';
        commandInput.value = '';
        autocompleteTextarea.parentElement.className = commandObj.Type;

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
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        
        checkbox.type = 'checkbox';
        checkbox.id = `checkbox-${checklistCounter}`;
        checkbox.name = `checkbox-${checklistCounter}`;
        
        label.htmlFor = `checkbox-${checklistCounter}`;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(content));
        
        checklistCounter++;
        
        if (!activeFormElement) {
            activeFormElement = document.createElement('form');
            activeFormElement.className = 'checklist-form';
            activeFormElement.appendChild(label);
            return activeFormElement;
        } else {
            activeFormElement.appendChild(label);
            return null;
        }
    } else if (currentType === 'ol' || currentType === 'ul') {
        const li = document.createElement('li');

        if (currentType === 'ol') {
            li.textContent = content;
            autocompleteTextarea.parentElement?.setAttribute('data-ol-count', olCounter + 1);
            olCounter++;
        } else {
            li.textContent = content;
        }

        if (!activeListElement || activeListElement.tagName.toLowerCase() !== currentType) {
            activeListElement = document.createElement(currentType);
            if (currentType === 'ol') suggestionContainer.setAttribute('data-ol-count', 2);
            activeListElement.appendChild(li);
            return activeListElement;
        } else {
            activeListElement.appendChild(li);
            return null;
        }
    } else {
        activeListElement = null;
        activeFormElement = null;
        olCounter = 1;

        const element = document.createElement(currentType);
        element.textContent = content;
        return element;
    }
}

// Event Listeners
autocompleteTextarea.addEventListener('input', (e) => {
    textInput = e.target.value;
    
    if (textInput.startsWith('/') && textInput.length === 1) {
        e.target.value = '';
        switchToCommandMode();
        return;
    }
    
    if (!textInput) {
        resetSuggestions();
        return;
    }
    
    resetSuggestions();
    autoResize.call(autocompleteTextarea);
});

commandInput.addEventListener('input', (e) => {
    textInput = e.target.value;
    
    if (!textInput || !textInput.startsWith('/')) {
        e.target.value = '/' + textInput;
        textInput = e.target.value;
    }
    
    const sections = textInput.split('/');
    if (sections.length === 2) {
        handleMainSuggestions();
    } else if (sections.length === 3) {
        handleSubSuggestions();
    } else {
        resetSuggestions();
    }
    
    commandTypedSpan.textContent = textInput;
    commandSuggestionSpan.textContent = suggestionSpan.textContent;
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
        if (!isCommandMode && textInput.trim()) {
            e.preventDefault();
            const noteElement = createNoteElement(textInput.trim());
            if (noteElement) {
                noteContainer.appendChild(noteElement);
            }
            autocompleteTextarea.value = '';
        }
    } else if (e.key === 'Escape') {
        activeListElement = null;
        activeFormElement = null;
    }
});

commandInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && suggestionsList.length > 0) {
        e.preventDefault();
        currentSuggestionIndex = (currentSuggestionIndex + 1) % suggestionsList.length;
        updateSuggestionDisplay();
    } else if (e.key === 'ArrowUp' && suggestionsList.length > 0) {
        e.preventDefault();
        currentSuggestionIndex = (currentSuggestionIndex - 1 + suggestionsList.length) % suggestionsList.length;
        updateSuggestionDisplay();
    } else if (e.key === 'Escape') {
        e.target.value = '';
        switchToTextMode();
    } else if (e.key === 'Enter' && suggestionsList.length > 0) {
        e.preventDefault();
        if (textInput.split('/').length === 3) {
            const selectedSubCommand = suggestionsList[currentSuggestionIndex].Name;
            applyCommand(selectedSubCommand);
            switchToTextMode();
        }
    } else if (e.key === 'Tab' && suggestionsList.length > 0) {
        e.preventDefault();
        
        if (textInput.split('/').length === 2) {
            const selectedCommand = suggestionsList[currentSuggestionIndex];
            textInput = `/${selectedCommand}/`;
            currentMainCommand = selectedCommand;
            commandInput.value = textInput;
            handleSubSuggestions();
        } else if (textInput.split('/').length === 3) {
            const selectedSubCommand = suggestionsList[currentSuggestionIndex].Name;
            textInput = `/${currentMainCommand}/${selectedSubCommand}`;
            commandInput.value = textInput;
            updateSuggestionDisplay();
            
            commandTypedSpan.textContent = textInput;
            commandSuggestionSpan.textContent = suggestionSpan.textContent;
        }
    }
});

function autoResize() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + "px";
}

noteContainer.innerHTML = '';
autocompleteTextarea.addEventListener('input', autoResize);





function createQuickMenu(commands) {
    const listMainCommand = document.createElement('ul');
    const listSubCommand = document.createElement('ul')
    const quickMenu = document.querySelector('.quick-menu');
    listMainCommand.className = 'main-command-container';
    listSubCommand.className = 'sub-command-container';

    for (const [mainCommand, subCommands] of Object.entries(commands)) {
        const mainCommandItem = document.createElement('li');
        const mainCommandButton = document.createElement('button');

        mainCommandButton.addEventListener("click", (e) => {
            document.querySelectorAll('.main-command-container button').forEach(button => {
                button.classList.remove("select");
            });
            mainCommandButton.classList.add("select");

            const buttons = document.querySelectorAll("ul.main-command-container button")
            const lists = document.querySelectorAll("ul.sub-command")
            
            buttons.forEach((button, index) => { 
                if (button.classList.contains('select')) { 
                    lists[index].classList.add('select'); 
                } else {
                    lists[index].classList.remove('select')
                }
            });
        });

        mainCommandButton.textContent = mainCommand;
        mainCommandItem.appendChild(mainCommandButton);

        const subCommandList = document.createElement('ul');

        subCommands.forEach(subCommand => {
            subCommandList.className = `sub-command`;
            const subCommandItem = document.createElement('li');
            const subCommandButton = document.createElement('button');
            subCommandButton.textContent = subCommand.Name;
            subCommandItem.appendChild(subCommandButton);
            subCommandList.appendChild(subCommandItem);
        });

        listMainCommand.appendChild(mainCommandItem);
        listSubCommand.appendChild(subCommandList)
    }
    quickMenu.appendChild(listMainCommand);
    quickMenu.appendChild(listSubCommand)
}

document.addEventListener('DOMContentLoaded', () => {
    createQuickMenu(commands);

    // Sélection par défaut de la première main-command et de sa sub-command associée
    const buttons = document.querySelectorAll("ul.main-command-container button");
    const subCommandLists = document.querySelectorAll("ul.sub-command");

    if (buttons.length > 0 && subCommandLists.length > 0) {
        buttons[0].classList.add("select");
        subCommandLists[0].classList.add("select");
    }
});
