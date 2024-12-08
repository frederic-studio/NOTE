const noteContainer = document.getElementById('note-container');
const noteItems = noteContainer.children;
const commandInput = document.querySelector('#command-search input');
const commandPalette = document.getElementById('command-palette');
const commandPaletteContainer = document.querySelector('#command-container');

const commands = {
    Text: [
        {Name: "display", Type: "h1"}, 
        {Name: "headline", Type: "h2"}, 
        {Name: "subtitle", Type: "h3"}, 
        {Name: "paragraph", Type: "p"}
    ],
    List: [
        {Name: "ordered", Type: "ol"},
        {Name: "unordered", Type: "ul"},
        {Name: "checklist", Type: "form"}
    ],
    Object: [
        {Name: "image", Type: "img"}, 
        {Name: "table", Type: "table"}, 
        {Name: "link", Type: "a"}
    ]
};

let targetNode;

const commandLookup = new Map();
Object.keys(commands).forEach(category => {
    commands[category].forEach(command => {
        commandLookup.set(command.Type.toLowerCase(), { ...command, category });
    });
});

function findCommandDetail(type, detail = null) {
    const command = commandLookup.get(type.toLowerCase());
    return command ? (detail ? command[detail] : command.category) : null;
}

function addItems(targetNode, newType) {
    let item;
    console.log(targetNode);
    commandPaletteContainer.hidePopover();
    if (targetNode.hasAttribute('data-type') && !newType) {
        item = targetNode.getAttribute('data-type');
        console.log(item);
    } else {
        item = newType ? newType : targetNode.tagName.toLowerCase();
        console.log(item);
    }
    let itemCategory = findCommandDetail(item, 'category');
    switch (itemCategory) {
        case 'Text': { return addText(targetNode, newType); }
        case 'List': { return addList(targetNode, newType); }
        case 'Object': { return addObject(targetNode, newType); }
        default: { console.error(`Unknown category: ${itemCategory}`); return null; }
    }
}

function addText(targetNode, newType) {
    let newElement
    let placeholder
    if (newType) {
        newElement = document.createElement(newType);
    } else {
        newElement = document.createElement('p');
    }
    placeholder = newElement.tagName.toLowerCase() === 'p' ? 
    'Type to add a paragraph or press "/" to add a different component' :
    `Type to add a ${findCommandDetail(newElement.tagName.toLowerCase(), 'Name')}`;
    targetNode.parentNode === noteContainer ? targetNode.insertAdjacentElement('afterend', newElement) : targetNode.closest('#note-container').appendChild(newElement);
    newElement.setAttribute('contenteditable', 'true');
    newElement.setAttribute('data-placeholder', placeholder);
    newElement.focus();
    if (newType && targetNode.textContent.length === 0 && !targetNode.classList.contains('title-page')) {
        targetNode.remove();
    }
        
    return newElement;
}

function addList(targetNode, newType) {
    let newElement = newType ? newType : targetNode.getAttribute('data-type');
    let templateId = `template-${findCommandDetail(newElement, 'Name')}`;
    let template = document.getElementById(templateId);
    let clone = template.content.cloneNode(true);
    let newItem

    if (newType) {
        newItem = clone.firstElementChild;
        targetNode.insertAdjacentElement('afterend', newItem);
    } else if (targetNode.textContent.length === 0) {
        addItems(targetNode, 'p');
        targetNode.parentNode !== newElement ? targetNode.parentElement.remove() : targetNode.remove();
        return
    } else {
        fun = clone.firstElementChild.children[0];
        targetNode.closest(newElement).appendChild(fun);
        newItem = fun.querySelector('[contenteditable]') || fun;
    }
    newItem.hasAttribute('contenteditable') ? newItem.focus() : newItem.querySelector('[contenteditable]').focus();
    if (newType && targetNode.textContent.length === 0 && !targetNode.classList.contains('title-page')) {
        targetNode.remove();
    }
    return newItem;
}

function handleBackspace(target) {

    if (target.parentNode && target.parentNode !== noteContainer && target.parentNode.firstElementChild === target) {
        if (target.previousElementSibling) {
            caretPosition(target.previousElementSibling.parentNode, 'set', 'end');
            target.parentNode.previousElementSibling.focus();
        }
        caretPosition(target.parentNode.previousElementSibling, 'set', 'end');
        target.parentNode.previousElementSibling.focus();
        target.parentNode.remove();
    } else {
        let previousElement = target.previousElementSibling;
        if (previousElement && !previousElement.hasAttribute('contenteditable')) {
            previousElement = previousElement.lastElementChild;
        }
        if (previousElement) {
            caretPosition(previousElement, 'set', 'end');
            previousElement.focus();
        }
        target.remove();
    }
}





























function caretPosition(element, action = 'get', position = 0) {
    const selection = window.getSelection();
    const range = document.createRange();

    if (action === 'get') {
        const currentRange = selection.getRangeAt(0);
        currentRange.setStart(element, 0);
        return currentRange.toString().length;
    } else if (action === 'set') {
        if (position === 'start') {
            range.setStart(element, 0);
        } else if (position === 'end') {
            range.selectNodeContents(element);
            range.collapse(false);
        } else {
            range.setStart(element, position);
        }
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

noteContainer.addEventListener('focus', (e) => {
    let editableElement = e.target.closest('[contenteditable="true"]');
    if (editableElement) {
        targetNode = editableElement;
        caretPosition(editableElement, 'set', 'end');
        editableElement.addEventListener('keydown', addEventListener);
        editableElement.addEventListener('blur', removeEventListener);
        }
    },
    true
  );

function addEventListener(e) {
    if (e.key === "Backspace") {
        if (e.target.textContent.length === 1) {
            e.target.innerHTML = '';
        } else if (e.target.textContent.length === 0 && !e.target.classList.contains('title-page')) {
            if (e.target.tagName !== 'P' && findCommandDetail(e.target.parentNode.tagName.toLowerCase()) !== 'List') {
                addItems(e.target, 'p');
            }
            e.preventDefault();
            handleBackspace(e.target);
        }
    }

    if (e.key === "Enter") {
        e.preventDefault();
        const newElement = addItems(targetNode);
        targetNode = newElement;
    }

    if (e.key === "/") {
        e.preventDefault();
        commandPaletteContainer.showPopover();
        e.target.blur();
        commandInput.focus();
        resetCommandPalette();
    }
}

function removeEventListener(e) {
    e.target.removeEventListener('keydown', addEventListener);
    e.target.removeEventListener('blur', removeEventListener);
}

async function fetchSVG(name) {
    const response = await fetch(`icon/${name}.svg`);
    if (response.ok) {
        return await response.text();
    } else {
        console.error(`Failed to fetch SVG: ${name}`);
        return '';
    }
}

async function populateCommandPalette() {
    for (const category of Object.keys(commands)) {
        const container = document.createElement('div');
        container.classList.add('command-section');
        const header = document.createElement('h4');
        header.textContent = category;
        container.appendChild(header);
        const ul = document.createElement('ul');
        for (const command of commands[category]) {
            const li = document.createElement('li');
            li.classList.add('command-item');
            const svgContent = await fetchSVG(command.Name.toLowerCase());
            li.innerHTML = `
                <button onclick="addItems(targetNode, '${command.Type}')">
                    ${svgContent}
                    <h5>${command.Name}</h5>
                </button>`;
            ul.appendChild(li);
        }
        container.appendChild(ul);
        commandPalette.appendChild(container);
    }
}

function resetCommandPalette() {
    const sections = commandPalette.querySelectorAll('.command-section');
    sections.forEach(section => {
        section.style.display = '';
        const items = section.querySelectorAll('.command-item');
        items.forEach(item => {
            item.style.display = '';
        });
    });
    const selected = commandPalette.querySelector('.select');
    if (selected) {
        selected.classList.remove('select');
    }
}



function filterCommandPalette(searchTerm) {
    const sections = commandPalette.querySelectorAll('.command-section');
    let firstMatch = null;

    sections.forEach(section => {
        const header = section.querySelector('h4');
        const items = section.querySelectorAll('.command-item');
        let sectionMatch = false;
        const searchLower = searchTerm.toLowerCase();

        if (header.textContent.toLowerCase().includes(searchLower)) {
            sectionMatch = true;
        }

        let itemMatch = false;
        items.forEach(item => {
            const commandName = item.querySelector('h5').textContent.toLowerCase();
            const commandType = item.querySelector('button').getAttribute('onclick').match(/'([^']+)'/)[1].toLowerCase();

            if (sectionMatch || commandName.includes(searchLower) || commandType.includes(searchLower)) {
                item.style.display = '';
                if (!firstMatch) {
                    firstMatch = item;
                }
                itemMatch = true;
            } else {
                item.style.display = 'none';
            }
        });

        if (sectionMatch || itemMatch) {
            section.style.display = '';
        } else {
            section.style.display = 'none';
        }
    });

    if (firstMatch) {
        firstMatch.classList.add('select');
    }
}

function handleKeyNavigation(e) {
    const selected = commandPalette.querySelector('.select');
    let newSelected;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        newSelected = selected.nextElementSibling || selected.parentElement.firstElementChild;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        newSelected = selected.previousElementSibling || selected.parentElement.lastElementChild;
    } else if (e.key === 'Enter') {
        e.preventDefault();
        const commandType = selected.querySelector('button').getAttribute('onclick').match(/'([^']+)'/)[1];
        addItems(targetNode, commandType);
        commandPaletteContainer.hidePopover();
        return;
    }

    if (newSelected) {
        selected.classList.remove('select');
        newSelected.classList.add('select');
    }
}

commandInput.addEventListener('input', (e) => {
    filterCommandPalette(e.target.value);
});

function focusTargetBack() {
    targetNode.focus();
}

commandInput.addEventListener('keydown', handleKeyNavigation);

// Initialize
populateCommandPalette();
commandInput.addEventListener('blur', (e) => { e.target.value = ''; });
