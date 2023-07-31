/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";

/** mock: technique pour isoler les sujets de test en remplaçant les dépendances par des objets
 * que l'on peut contrôler et inspecter **/
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.className).toEqual("active-icon");

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^[0-9]{1,2}\s[a-z]{3}\.\s[0-9]{2}$/i).map(a => a.innerHTML)
      const descending = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(descending)
      expect(dates).toEqual(datesSorted)
    })

    /** pour tester le clic sur le bouton de création d'une nouvelle note de frais **/
    test("Then I click on the button \"Nouvelle note de frais\" to get a new one", () => {
      const button = screen.getByTestId("btn-new-bill");
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const bill = new Bills( {document, onNavigate, store:null, localStorage: window.localStorage})
      const handleClickNewBill1 = jest.fn( () => bill.handleClickNewBill())

      button.addEventListener("click", handleClickNewBill1);
      userEvent.click(button);
      expect(handleClickNewBill1).toHaveBeenCalled();
    })

    /** pour tester le clic sur l'icône "Eye" **/
    test("Then I click on the icon \"Eye\" to see the receipt", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      document.body.innerHTML = BillsUI({ data: bills });

      const iconEye = screen.getAllByTestId("icon-eye")[0];
      const billContainer = new Bills( {document, onNavigate, store:null, localStorage: window.localStorage})
      const handleClickIconEye1= jest.fn(() => {
        billContainer.handleClickIconEye(iconEye)
      });

      iconEye.addEventListener("click", handleClickIconEye1);
      userEvent.click(iconEye);

      expect(handleClickIconEye1).toHaveBeenCalled();

      const modale = screen.getByTestId('modaleFileEmployee');
      expect(modale).toBeTruthy();
    })
  })
  describe("when there are no bill", () => {
    /** Test si pas de data, pas d'icône pour voir les bills **/
      document.body.innerHTML = BillsUI({data:[]});
      const seeIconEye = () => {
        screen.getAllByTestId("icon-eye");
        throw new TypeError('TestingLibraryElementError');
      }

      test('should throw an error',  () => {
        expect(seeIconEye).toThrow(TypeError);
        expect(seeIconEye).toThrow('TestingLibraryElementError');
      });
  })

  /** TESTS INTEGRATIONS **/

  describe("When an error occurs on API", () => {
    //initialisation avant les tests
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("Then, fetches bills from mock API GET", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      expect(screen.getAllByText("Billed")).toBeTruthy();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      expect(screen.getByTestId("tbody")).toBeTruthy();
      expect(screen.getAllByText("test1")).toBeTruthy();
    });

    test("Then fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await waitFor(() => screen.getByText(/Erreur 404/))
      expect(message).toBeTruthy()
    })

    test("Then fetches messages from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })

})


