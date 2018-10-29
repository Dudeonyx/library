/* eslint-env browser */
const titleCase = string => string.toLowerCase().replace(/^.| ./g, u => u.toUpperCase()); // eslint-disable-line no-unused-vars

const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);

const libraryModule = (() => {
  const myObject = (() => {
    function copy(o, flag) {
      const output = Array.isArray(o) ? [] : {};
      Object.keys(o).forEach((key) => {
        const v = o[key];
        output[key] = typeof v === 'object' && flag === true ? copy(v) : v;
      });
      return output;
    }
    function merge(objectA = {}, ...objects) {
      let flag;
      if (typeof objects[objects.length - 1] === 'boolean') {
        flag = objects.pop();
      }
      const newObject = Array.isArray(objectA) ? [] : Object.create(Object.getPrototypeOf(objectA));
      const propsA = Object.getOwnPropertyNames(objectA);
      propsA.forEach((prop) => {
        // if (Array.isArray(objectA) && prop === 'length') return;
        const desc = Object.getOwnPropertyDescriptor(objectA, prop);
        if (flag === true && desc.value !== null && typeof desc.value === 'object') {
          desc.value = merge(desc.value, true);
        }
        Object.defineProperty(newObject, prop, desc);
      });
      objects.forEach((object) => {
        const props = Object.getOwnPropertyNames(object);
        props.forEach((prop) => {
          const desc = Object.getOwnPropertyDescriptor(object, prop);
          if (flag === true && desc.value !== null && typeof desc.value === 'object') {
            desc.value = merge(desc.value, true);
          }
          if (prop !== 'constructor' && prop in newObject) {
            if (!newObject.duplicateProperties) {
              newObject.duplicateProperties = {};
            }
            Object.defineProperty(newObject.duplicateProperties, prop, desc);
          } else {
            Object.defineProperty(newObject, prop, desc);
          }
        });
      });
      return newObject;
    }
    function setConstructor(constructor) {
      return (o, allMethodsPrototypal = false) => {
        const proto1 = Object.create(Object.getPrototypeOf(o));
        proto1.constructor = constructor;
        if (allMethodsPrototypal === true) {
          return Object.create(merge(proto1, o));
        }
        const proto2 = Object.create(proto1);
        return merge(proto2, o);
      };
    }
    function rClone(o, flag) {
      const clone = Array.isArray(o) ? [] : {};
      const props = Object.getOwnPropertyNames(o);
      props.forEach((prop) => {
        const desc = Object.getOwnPropertyDescriptor(o, prop);
        if (flag === true && desc.value !== null && typeof desc.value === 'object') {
          desc.value = rClone(desc.value, true);
        }
        Object.defineProperty(clone, prop, desc);
      });
      return clone;
    }
    return Object.freeze({
      merge,
      setConstructor,
      rClone,
      copy,
    });
  })();
  function LibraryList(libraryList = []) {
    return {
      withAddToLibraryList: o =>
        myObject.merge(o, {
          addToLibraryList(library = this) {
            // if (library.constructor !== Library) throw new Error('Invalid Library');
            const libraryIndex = libraryList.findIndex(entry => entry.username === library.username);
            // check if another book with the same name is already in the shelf
            if (libraryIndex > -1) {
              console.log(`'${library.username}' already exists in Users`);
              return this;
            }
            libraryList.push(library);
            // console.log(`'${library.username}' has been added to Users`);
            return this;
          },
        }),
      allUsers: () => libraryList,
      showLibraryList: () =>
        libraryList.reduce((acc, val) => `${acc}'${val.username}', `, '').replace(/, $/, ''),
    };
  }
  const { showLibraryList, allUsers, withAddToLibraryList } = LibraryList([]);
  function Library(user) {
    const username = titleCase(user);
    function withShelfFunctions() {
      const shelf = [];
      return o =>
        myObject.merge(o, {
          get shelf() {
            return shelf.reduce((acc, val) => `${acc}'${val.title}', `, '').replace(/, $/, '');
          },
          listBooks() {
            return shelf.reduce((acc, val) => `${acc}'${val.title}', `, '').replace(/, $/, '');
          },
          displayShelf() {
            return shelf.concat();
          },
          deleteBookByIndex(bookIndex) {
            if (bookIndex > shelf.length) {
              throw new Error(`No book with index: ${bookIndex} exists in ${username}'s Library`);
            }
            const deletedBookTitle = shelf[bookIndex].title;
            shelf.splice(bookIndex, 1);
            return `'${deletedBookTitle}' has been deleted from ${username}'s Library`;
          },
          saveBook(book) {
            // const { shelf } = this;
            const bookIndex = shelf.findIndex(entry => entry.title === book.title);
            // check if another book with the same name is already in the shelf
            if (bookIndex > -1) {
              return `'${book.title}' already exists in ${username}'s Library`;
            }
            shelf.push(book);
            return `'${book.title}' has been added to ${username}'s Library`;
          },
          deleteBook(book) {
            const bookIndex = shelf.findIndex(entry => entry === book || entry.title === book.title);
            // check if book is in the shelf
            if (bookIndex > -1) {
              shelf.splice(bookIndex, 1);
              return `'${book.title}' has been deleted from ${username}'s Library`;
            }
            return `'${book.title}' does not exist in ${username}'s Library`;
          },
        });
    }
    function Book(bookObject, owner = username) {
      const { title = 'Unknown', author = 'Unknown', pages = 0 } = bookObject;
      let status = bookObject.status ? titleCase(bookObject.status) : 'Not Read';
      const bookIndex = this.displayShelf().findIndex(book => book.title === title && book.author === author);
      // check if another book with the same name is already in the shelf
      if (bookIndex > -1) {
        throw new Error(`A book titled:'${title}' already exists in ${username}'s Library`);
      }
      function details(detail) {
        const allDetails = {
          title,
          author,
          pages,
          status,
          Library: owner,
        };
        return detail ? { [titleCase(detail)]: allDetails[titleCase(detail)] } : allDetails;
      }
      const toggleRead = (newStatus) => {
        const validStatus = !newStatus || titleCase(newStatus);
        if (newStatus || validStatus === 'Read' || validStatus === 'Not Read') {
          status = validStatus;
          return status;
        }
        status = status === 'Read' ? 'Not Read' : 'Read';
        return status;
      };
      const parent = this;
      function saveThisIn(library = parent) {
        return library.saveBook(this);
      }
      function deleteThisIn(library = parent) {
        return library.deleteBook(this);
      }
      const book = pipe(myObject.setConstructor(this.createBook))({
        get title() {
          return title;
        },
        get author() {
          return author;
        },
        details,
        get owner() {
          return owner;
        },
        toggleRead,
        saveThisIn,
        deleteThisIn,
      });
      this.saveBook(book);
      return Object.freeze(book);
    }
    const newLibrary = pipe(
      withAddToLibraryList,
      withShelfFunctions(),
      myObject.setConstructor(Library),
    )({
      get username() {
        return username;
      },
      createBook: Book,
    });
    newLibrary.addToLibraryList();
    return Object.freeze(newLibrary);
  }
  Library.showLibraryList = showLibraryList;
  Library.allUsers = allUsers;
  // Library.addToLibraryList = addToLibraryList;
  return { Library, myObject };
})();

const { Library } = libraryModule;
const umeayo = Library('Umeayo');
umeayo.createBook({
  title: 'Stories in JS',
  pages: 128,
  status: 'Read',
  author: 'Dudeonyx',
});
umeayo.createBook({
  title: 'Adventures in JS',
  pages: 256,
  status: 'Not Read',
  author: 'Dudeonyx',
});
umeayo.createBook({
  title: 'Wonders of JS',
  pages: 512,
  status: 'Read',
  author: 'Dudeonyx',
});
umeayo.createBook({
  title: 'JS',
  pages: 1024,
  status: 'Read',
  author: 'Dudeonyx',
});
umeayo.createBook({
  title: 'SuperJS',
  pages: 2048,
  status: 'Read',
  author: 'Dudeonyx',
});

function $(element = document) {
  return selector => element.querySelector(selector);
}
function $All(element = document) {
  return selector => element.querySelectorAll(selector);
}
function $Create(element) {
  return document.createElement(element);
}
const shelf = $()('.shelf');

const testBook = $Create('div');
testBook.classList.add('book');
// shelf.appendChild(testBook);
function addAllBooksToDOMShelf(library = Library.allUsers()[0]) {
  shelf.innerHTML = '';
  library.displayShelf().forEach((book, index) => {
    const bookElement = $Create('div');
    bookElement.classList.add('flex-column', 'book');
    bookElement.id = index;
    // bookElement.setAttribute('data-title', book.details().title);
    Object.entries(book.details()).forEach((key) => {
      if (key[0] !== 'Library') {
        const div = bookElement.appendChild($Create('div'));
        div.classList.add(`${key[0]}`, 'flex-row', 'flex-justify-center');
        const field = div.appendChild($Create('p'));
        field.textContent = key[0] === 'title' ? key[1] : `${titleCase(key[0])}: ${key[1]}`;
        // field.setAttribute('data-index', index);
        // field.setAttribute(`data-${key[0]}`, key[1]);
        if (key[0] === 'status') {
          div.addEventListener('click', () => {
            book.toggleRead();
            addAllBooksToDOMShelf();
          });
        }
      }
    });
    const deleteDiv = bookElement.appendChild($Create('div'));
    const deleteButton = deleteDiv.appendChild($Create('p'));
    deleteDiv.classList.add('delete', 'flex-row', 'flex-justify-center');
    deleteButton.setAttribute('data-index', index);
    deleteButton.textContent = 'Delete';
    deleteDiv.addEventListener('click', () => {
      const titleToDelete = book.title;
      const answer = confirm(`Are you sure you want to delete ${titleToDelete}?`);
      if (answer) {
        library.deleteBookByIndex(index);
        addAllBooksToDOMShelf();
        alert(`${titleToDelete} has been deleted!`);
      }
    });
    shelf.appendChild(bookElement);
  });
  const addBook = $()('#addBook');
  addBook.addEventListener('click', () => {
    document.body.classList.add('showform');
  });
  // const submitBook = $()('#submiter');
  const newBookForm = $()('#newBookForm');
  newBookForm.addEventListener('submit', () => {
    if (newBookForm.reportValidity()) {
      const title = newBookForm.title.value;
      const author = titleCase(newBookForm.author.value);
      const status = newBookForm.status.value;
      const pages = newBookForm.pages.value;
      library.createBook({
        title,
        author,
        pages,
        status,
      });
      addAllBooksToDOMShelf();
      // document.body.classList.remove('showform');
      newBookForm.reset();
    }
  }, true);
  // const resetBook = $()('#reseter');
  newBookForm.addEventListener('reset', () => {
    document.body.classList.remove('showform');
  });
}
addAllBooksToDOMShelf();


/* $(shelf)('.book>.status').addEventListener('click', (evt) => {
  console.log(evt);
}); */
// const fgh = $(shelf)('.book>.delete>p');
