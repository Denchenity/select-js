//import { parseDate } from '../functions';
//Description
// заполнить лист передать в data массив [{name:'Name', id:'100'}]

function getTemplate(option){

    let text = '';
    let id = '';

    let list = [];

    if(option.data != undefined || option.data != null){
        list = option.data.map(item => {
            if(item.id == option.selectedId){
                text = item.name;
                id = item.id;
            }
            return `<p data-type="list-item" data-id="${item.id}">${item.name}</p>`;
        });
    }

    return `
        <div data-type="backdrop" class="select-js-backdrop"></div>
        <input value="${text}" data-type="input" type="text" class="${option.inputClass ?? 'table-input'}" placeholder="${option.placeholder ?? ''}" ${option.readonly ? 'readonly' : ''} ${option.required ? 'required' : ''}>
        <input value="${id}"  type="hidden" name="${option.model}">
        <label class="select-js-label">${option.label ?? ''}</label>
        ${option.arrow ? `<div class="select-js-arrow" data-type="arrow"></div>` : ''}
        ${option.clean ? `<div class="select-js-clean" data-type="clean"></div>` : ''}
        <div class="select-js-list" data-type="list">${list.join('')}</div>
    `;
}

export class SelectV2 {

    constructor(option){

        this.url = option.url;  // Куда отпраялвется запрос
        this.value = option.value; // Если нужно подставить значение
        this.selector = option.selector; // сcs-селектор родителя(куда вставить инпут)
        this.model = option.model;// Название модели для атрибута name
        this.query = option.query;// по событию input будет срабатывать запрос в экшн (bool)
        this.required = option.required;// обязательное поле (bool)
        this.data = option.data;// если передаем данные из экшена не через запрос, а через html-атрибут 
        this.inputClass = option.inputClass;// класс для инпута
        this.label = option.label;// класс для инпута
        this.placeholder = option.placeholder;//чтобы работал label нужен placeholder
        this.readonly = option.readonly;//(bool)
        this.arrow = option.arrow;//(bool)
        this.clean = option.clean;//(bool)
        this.edit = option.edit;// параметр редактирования
        this.selectedId = option.selectedId; // id выбранного элемента из спика

        this.$wrapper = document.createElement('div');
        this.$wrapper.classList.add('select-js-wrapper');

        this.option = option;

        this.#render(option);
        this.input = this.$wrapper.querySelector('input[type="text"]');
        this.inputHidden = this.$wrapper.querySelector('input[type="hidden"]');
        this.#setup();
       

        //для поиска вводом
        this.list = this.$wrapper.querySelector('[data-type="list"]');

        this.#checkEdit();

        this.hierarchy = option.hierarchy; // принимает массив [{docid,groupDoc,isgroup,Name}]

        if(this.hierarchy){
            if(this.hierarchy.length != 0){
                this.hierarchyMenu();
            }
        }
    
    }
    
    getWrapper(){
        return this.$wrapper;        
    }

    #render(){
        this.$wrapper.innerHTML = getTemplate(this.option);

        if(this.selector){
            const out = document.querySelector(this.selector);
            out.append(this.$wrapper);
        }
    }

    #setup(){
        this.clickHandler = this.clickHandler.bind(this);
        this.$wrapper.addEventListener('click', this.clickHandler);

        this.inputHandler = this.inputHandler.bind(this);
        
        this.input.addEventListener('input', this.inputHandler);
    }

    clickHandler(event){
        const {type} = event.target.dataset;
        
        if(type === 'input' || type === 'arrow'){
            this.toggle();
        }else if(type === 'clean'){
            this.input.value = '';
            this.inputHidden.value = '';
            // this.chekErrorClass();
            this.refreshSelected();
        }else if(type === 'list-item'){
            this.select(event.target.dataset.id);
        }else if(type === 'backdrop'){
            this.toggle();
        }
    }

    inputHandler(event){
        
        let value = event.target.value;

        let search = this.option.data.filter(el => searchItems(el.name, value));

        this.list.innerHTML = getItems(search);

        function getItems(array){
            let result = array.map(item=> {
                return `<p data-type="list-item" data-id="${item.id}">${item.name}</p>`;
            });
            return result.join('');
        }

        function searchItems(elem, value){
            let bool = false;
            let regexLeft = new RegExp('^' + value, 'i');
            let regexRight = new RegExp(' ' + value, 'i');
            if(regexLeft.test(elem) || regexRight.test(elem)){
                bool = true;
            }

            return bool;
        }

        if(value === ''){
            this.list.innerHTML = getItems(this.option.data);
        }
    }

    select(id){
        this.selectedId = id;
        this.input.value = this.current.name;
        this.inputHidden.value = this.current.id;

        this.refreshSelected();
        this.$wrapper.querySelector(`p[data-id="${id}"]`).classList.add('selected');
        this.close();
    }

    refreshSelected(){
        this.$wrapper.querySelectorAll(`[data-type="list-item"]`).forEach(item => item.classList.remove('selected'));
    }

    get current(){
        return this.option.data.find(item => item.id == this.selectedId);
    }

    get isOpen(){
        return this.$wrapper.classList.contains('_open-select-js-list');
    }

    get isError(){
        return this.$wrapper.classList.contains('has-error');
    }

    toggle(){
        this.isOpen ? this.close() : this.open();
    }

    chekErrorClass(){
        this.isError ? this.$wrapper.classList.remove('has-error') : this.$wrapper.classList.add('has-error');
    }

    pasteHandler(event){

    }

    open(){
        this.$wrapper.classList.add('_open-select-js-list');
    }

    close(){
        this.$wrapper.classList.remove('_open-select-js-list');
    }

    #checkEdit(){
        if(this.edit != undefined){
            if(!this.edit){
                this.$wrapper.classList.add('_no-edit');
            }
        }
    }

    destroy(){
        this.$wrapper.removeEventListener('click', this.clickHander);
        this.$wrapper.parentElement.innerHTML = '';

        this.input.removeEventListener('input', this.inputHandler);
    }

    hierarchyMenu(){
        const data = this.hierarchy;
        const wrapper = this.$wrapper;
        const list = this.list;
        const inputHidden = this.inputHidden;
        const inputText = this.input;

        

        let first = data.filter(el => el.groupDoc == 0);

        first.forEach(el => {

            if(isGroup(el)){
                checkChild(createSubnav(el));
            }
            
        })

        function checkChild(arr){
            arr.forEach(el => {
                if(isGroup(el)){
                    checkChild(createSubnav(el));
                }
            });
        }

        function createSubnav(el){
            let { docid } = el;
            let arr = data.filter(el => docid == el.groupDoc);
            el.child = arr;
            return arr;
        }

        function isGroup(el){
            return el.isgroup === true ? true : false;
        }


        let firstLevel = [];
        data.forEach(el => {
            if(el.groupDoc == 0){
                firstLevel.push(el);
            }
        });

        //сортировка по DOB(если есть)
        if(firstLevel[0].DOB){
            let copyFirstLvl = firstLevel.map(el => el);
            
            firstLevel.length = 0;
            
            copyFirstLvl.sort(function(a,b){
                return parseFloat(Date.parse(parseDate(a.DOB))) - parseFloat(Date.parse(parseDate(b.DOB)));
            });

            let filterFirstLvl = copyFirstLvl.filter(el => el.DOB != '');
            let transferringPeriod = copyFirstLvl.find(el => el.DOB == '');
            filterFirstLvl.push(transferringPeriod);
            filterFirstLvl.forEach(el => firstLevel.push(el));
        }

        let secondLevel = [];
        firstLevel.forEach(firstLink => {
            let docid = firstLink.docid;
            let arr = [];
            data.forEach(el => {
                if(el.groupDoc == docid){
                    arr.push(el);
                }
            });
            secondLevel.push(arr);
        });

        let thirdLevel = [];
        secondLevel.forEach(arr => {
            arr.forEach(el => {
                let arr = [];
                let docid = el.docid;
                data.forEach(el => {
                    if(el.groupDoc == docid){
                        arr.push(el);
                    }
                });
                thirdLevel.push(arr);
            });
        });

        firstLevel.forEach((first,i) => {
            let wrapper = document.createElement('div');
            wrapper.classList.add('select-js-subnav-first-level');
            let pFirst = document.createElement('p');
            pFirst.textContent = first.name;
            pFirst.setAttribute('DocID', first.docid);
            pFirst.setAttribute('link-first', i);
            pFirst.addEventListener('click', openSubnavFirst);

            let divFirst = document.createElement('div');
            divFirst.classList.add('select-js-list-subnav');
            divFirst.setAttribute('block-first', i);

            wrapper.append(pFirst);
            wrapper.append(divFirst);
            list.append(wrapper);

        });

        let firstLevelBox = list.querySelectorAll('[block-first]');
        let tempSecondArray = [];
        secondLevel.forEach(array => {
            let wrapper = document.createElement('div');
            wrapper.classList.add('select-js-subnav-second-level');
            array.forEach((el,i)=>{
                let p = document.createElement('p');
                p.textContent = el.name;
                p.setAttribute('DocID', el.docid);
                p.setAttribute('link-second', i);
                p.addEventListener('click', openSubnavSecond)

                let thridLevel = document.createElement('div');
                thridLevel.classList.add('select-js-subnav-third-level');
                thridLevel.setAttribute('block-second', i)
                let div = document.createElement('div');
                div.append(p);
                div.append(thridLevel);
                wrapper.append(div);

            });
            tempSecondArray.push(wrapper)
        });
        for(let i =0; i < firstLevelBox.length; i++){
            firstLevelBox[i].append(tempSecondArray[i]);
        }

        let thirdLevelBox = list.querySelectorAll('.select-js-subnav-third-level');
        for(let i =0; i < thirdLevelBox.length; i++){
            thirdLevel[i].forEach(el => {
                let p = document.createElement('p');
                p.textContent = el.name;
                p.setAttribute('DocID', el.docid);
                    p.setAttribute('link-third', i);

                    thirdLevelBox[i].append(p)
            });
        }

        //программируем subnav
        function openSubnavFirst(event){
            let link = event.target;
            let value = link.getAttribute('link-first')
            let list = link.parentElement.querySelector(`[block-first="${value}"]`);
            list.classList.toggle('_open')
        }
        function openSubnavSecond(event){
            let link = event.target;
            let value = link.getAttribute('link-second')
            let list = link.parentElement.querySelector(`[block-second="${value}"]`);
            list.classList.toggle('_open')
        }

        let allP = wrapper.querySelectorAll('p');
        allP.forEach(p => {
            p.addEventListener('dblclick', ()=> {
                let text = p.textContent;
                let docid = p.getAttribute('DocID');
                inputText.value = text;
                inputHidden.value = docid;
                wrapper.classList.remove('_open-select-js-list');
            });
        });
    }
}
