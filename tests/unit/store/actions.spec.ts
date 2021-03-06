import Vue from 'vue'
import '@/globals/variables'
import actions from '@/store/actions'
import { Cart } from '@/types/Cart'
import emptyState from '../fixtures/state'
import orders from '../fixtures/orders'

// @ts-ignore
import { post } from '@molgenis/molgenis-api-client'
import axios from 'axios'
import ApplicationState from '@/types/ApplicationState'
import { OrderState } from '@/types/Order'
import * as orderService from '@/services/orderService'
import { setRolePermission, setUserPermission } from '@/services/permissionService'
import { fetchVariables } from '@/repository/VariableRepository'

const cart: Cart = {
  selection: [{
    assessment: '1A',
    variables: ['VAR1', 'VAR2']
  }],
  filters: {
    ageGroupAt1A: ['18-65', '65+']
  }
}

function getApplicationState () {
  const state: ApplicationState = {
    ...emptyState,
    order: {
      orderNumber: '12345',
      name: null,
      projectNumber: null,
      applicationForm: null,
      state: OrderState.Draft,
      submissionDate: 'submissionDate',
      creationDate: 'creationDate',
      updateDate: 'updateDate',
      contents: {
        id: 'content-id',
        filename: 'filename',
        url: 'url'
      },
      user: 'test',
      email: 'test@molgenis.org'
    }
  }

  return state
}

const mockResponses: { [key: string]: Object } = {
  '/api/v2/lifelines_order?num=10&start=0': {
    items: orders,
    total: orders.length
  },
  '/api/v2/lifelines_order?num=10000': {
    items: orders,
    total: orders.length
  },
  '/api/v2/lifelines_order/fghij': {
    contents: {
      id: 'xxyyzz'
    }
  },
  '/api/v2/lifelines_order/source_order': {
    contents: {
      id: 'source_cart'
    },
    user: 'anonymous'
  },
  '/api/v2/lifelines_order/sourceOrderNumber_dm_test': {
    contents: {
      id: 'dm_test'
    },
    user: 'bert',
    email: 'bert@test.org',
    name: 'dm_test_name',
    projectNumber: 'dm_test_projectNumber'
  },
  '/api/v2/lifelines_order/Copy123': {
    contents: {
      id: 'copy_cart'
    },
    user: 'anonymous'
  },
  '/api/v2/lifelines_order/source_order_with_form': {
    contents: {
      id: 'source_cart'
    },
    applicationForm: {
      id: 'applicationFormId'
    },
    user: 'anonymous'
  },
  '/api/v2/lifelines_order/dm-copy': {
    user: 'bert',
    contents: { id: 'dm-copy-order-content-id' },
    applicationForm: { id: 'dm-copy-order-applicationForm-id' }
  },
  '/files/applicationFormId': {
    filename: 'test.pdf',
    blob () {
      return new Blob()
    }
  },
  '/files/source_cart': {
    items: [
      { id: 1, name: 'section1' },
      { id: 2, name: 'section2' }
    ]
  },
  '/api/v2/lifelines_order/12345': {
    contents: {
      id: 'bla'
    }
  },
  '/files/xxyyzz': cart,
  '/files/dm_test': cart,
  '/api/v2/lifelines_section?num=10000': {
    items: [
      { id: 1, name: 'section1' },
      { id: 2, name: 'section2' }
    ]
  },
  '/api/v2/lifelines_section?num=10000&q=*%3Dq%3Dhello': {
    items: [
      { id: 1, name: 'section1' }
    ]
  },
  '/api/v2/lifelines_subsection_variable?aggs=x==subsection_agg&q=*%3Dq%3Dhello': {
    aggs: {
      xLabels: [
        '1',
        '3'
      ]
    }
  },
  '/api/v2/lifelines_sub_section?num=10000': {
    items: [
      { id: 1, name: 'sub_section1' },
      { id: 2, name: 'sub_section2' }
    ]
  },
  '/api/v2/lifelines_tree?num=10000': {
    items: [
      { id: 1, section_id: { id: 1 }, subsection_id: { id: 1 } },
      { id: 2, section_id: { id: 1 }, subsection_id: { id: 2 } }
    ]
  },
  '/api/v2/lifelines_assessment': {
    items: [
      { id: 1, name: '1A' },
      { id: 2, name: '1B' }
    ]
  },
  '/api/v2/lifelines_variable?attrs=id,name,subvariable_of,label,subsections&num=10000&sort=id': {
    items: [{
      id: 2,
      name: 'ARZON',
      label: 'Suncream used',
      subsections: '1'
    }, {
      id: 3,
      name: 'SAF',
      label: 'SAF',
      subsections: '1,2'
    }]
  },
  '/api/v2/lifelines_variable?attrs=id,name,subvariable_of,label,subsections&num=10000&start=10000&sort=id': {
    items: [{
      id: 4,
      name: 'UVREFLECT',
      label: 'Reflection',
      subsections: '1'
    }, {
      id: 5,
      name: 'ARCREME',
      label: 'Skin cream used',
      subsections: null
    }]
  },
  '/api/v2/lifelines_variable?q=name=q=cream,label=q=cream&attrs=id,name,label,subvariable_of,subvariables,variants(id,assessment_id),definition_en,definition_nl,options(label_en)&num=10000&sort=id': {
    items: [{
      id: 2,
      name: 'ARZON',
      label: 'Suncream used',
      variants: [{
        id: 197,
        assessment_id: 1
      }],
      options: []
    }, {
      id: 3,
      name: 'SAF',
      label: 'SAF',
      variants: [{
        id: 197,
        assessment_id: 1
      }],
      options: []
    }, {
      id: 4,
      name: 'UVREFLECT',
      label: 'Reflection',
      variants: [{
        id: 197,
        assessment_id: 1
      }],
      options: []
    }, {
      id: 4,
      name: 'ARCREME',
      label: 'Skin cream used',
      variants: [{
        id: 197,
        assessment_id: 1
      }],
      options: []
    }]
  },
  '/api/v2/lifelines_subsection_variable?q=subsection_id==3&attrs=~id,id,subsection_id,variable_id(id,name,label,subvariable_of,subvariables,variants(id,assessment_id),definition_en,definition_nl,options(label_en))&num=10000&sort=variable_id': {
    items: [{
      variable_id: {
        id: 2,
        name: 'ARZON',
        label: 'Suncream used',
        variants: [{
          id: 197,
          assessment_id: 1
        }],
        options: []
      }
    }, {
      variable_id: {
        id: 4,
        name: 'ARCREME',
        label: 'Skin cream used',
        variants: [{
          id: 197,
          assessment_id: 1
        }],
        options: []
      }
    }]
  },
  '/api/v2/lifelines_who?num=0': {
    total: 123456
  },
  '/api/v2/lifelines_who?num=0&q=yob%3Dle%3D1970': {
    total: 3456
  },
  '/api/v2/lifelines_who_when?aggs=x==variant_id&q=ll_nr.yob%3Dle%3D1970': {
    aggs: {
      matrix: [[1234], [5678]],
      xLabels: [{
        assessment_id: '1',
        id: '1'
      }, {
        assessment_id: '2',
        id: '10'
      }
      ]
    }
  },
  '/api/v2/lifelines_who_when?aggs=x==variant_id': {
    aggs: {
      matrix: [[12340], [56780]],
      xLabels: [{
        assessment_id: '1',
        id: '1'
      }, {
        assessment_id: '2',
        id: '10'
      }
      ]
    }
  }
}

const mockDelete = jest.fn()

jest.mock('@/repository/VariableRepository', () => {
  return {
    fetchVariables: jest.fn()
  }
})

jest.mock('@/services/permissionService', () => {
  return {
    setUserPermission: jest.fn(),
    setRolePermission: jest.fn()
  }
})

jest.mock('@/services/orderService', () => {
  return {
    buildOrdersQuery: jest.fn(),
    buildFormData: jest.fn(),
    generateOrderNumber: jest.fn()
  }
})

jest.mock('@molgenis/molgenis-api-client', () => {
  return {
    get: (url: string) => {
      if (!mockResponses.hasOwnProperty(url)) {
        console.warn('mock response not found for url', url)
      }
      return Promise.resolve(mockResponses[url])
    },
    post: jest.fn(),
    delete_: function () { mockDelete(...arguments) }
  }
})

jest.mock('@/services/variableSetOrderService', () => {
  return {
    finalVariableSetSort: (variables: any) => variables
  }
})

describe('actions', () => {
  describe('loadOrders', () => {
    it('loads the orders and commits them', async (done) => {
      const commit = jest.fn()
      // @ts-ignore
      orderService.buildOrdersQuery.mockReturnValue('?num=10&start=0')
      await actions.loadOrders({ commit }, {})

      expect(commit).toHaveBeenCalledWith('setOrders', {
        items: orders,
        total: orders.length
      })
      done()
    })
  })

  describe('deleteOrder', () => {
    it('deletes the order and loads the orders again', async (done) => {
      const commit = jest.fn()
      const dispatch = jest.fn()
      const action = actions.deleteOrder({ commit, dispatch }, 'abcde')
      await action
      expect(mockDelete).toHaveBeenCalledWith('/api/v2/lifelines_order/abcde')

      done()
    })
  })

  describe('loadSections', () => {
    it('fetch the sections and commits them', async (done) => {
      const commit = jest.fn()
      await actions.loadSections({ state: { sections: {} }, commit })
      expect(commit).toHaveBeenCalledWith('updateSections', {
        1: { id: 1, name: 'section1' },
        2: { id: 2, name: 'section2' }
      })
      done()
    })

    it('not fetch the sections if already in state', async (done) => {
      const commit = jest.fn()
      await actions.loadSections({ state: { sections: { 1: { id: 1, name: 'section1' } } }, commit })
      expect(commit).toHaveBeenCalledTimes(0)
      done()
    })
  })

  describe('loadSubSections', () => {
    it('fetch the sub sections and commits them as a string list', async (done) => {
      const commit = jest.fn()
      await actions.loadSubSections({ state: { subSectionList: [] }, commit })
      expect(commit).toHaveBeenCalledWith('updateSubSections', [
        undefined, // todo refactor action to remove this undefined item
        'sub_section1',
        'sub_section2'
      ])
      done()
    })

    it('not fetch the sub sections if already in state', async (done) => {
      const commit = jest.fn()
      await actions.loadSubSections({ state: { subSectionList: ['sub_section1'] }, commit })
      expect(commit).toHaveBeenCalledTimes(0)
      done()
    })
  })

  describe('loadSectionTree', () => {
    it('fetches the sections in tree form', async (done) => {
      const commit = jest.fn()
      await actions.loadSectionTree({ state: { treeStructure: [] }, commit })
      expect(commit).toHaveBeenCalledWith('updateSectionTree', [{ 'key': '1', 'list': [1, 2] }])
      done()
    })
    it('wont fetch if data is loaded already', async (done) => {
      const commit = jest.fn()
      await actions.loadSectionTree({ state: { treeStructure: [0, 1] }, commit })
      expect(commit).toHaveBeenCalledTimes(0)
      done()
    })
  })

  describe('loadAssessments', () => {
    it('loads the assessments and commits them', async (done) => {
      const commit = jest.fn()
      await actions.loadAssessments({ commit })
      expect(commit).toHaveBeenCalledWith('updateAssessments', {
        1: { id: 1, name: '1A' },
        2: { id: 2, name: '1B' }
      })
      done()
    })
  })

  describe('loadGridVariables', () => {
    describe('when searchTermQuery is empty', () => {
      let commit: any

      beforeEach(async (done) => {
        commit = jest.fn()
        await actions.loadGridVariables({
          getters: { searchTermQuery: '' },
          commit
        })
        done()
      })
      it('should clear the gridVariables and return ', () => {
        expect(commit).toHaveBeenCalledWith('updateGridVariables', null)
        expect(fetchVariables).not.toHaveBeenCalled()
      })
    })

    describe('when searchTermQuery is not empty', () => {
      let commit: any

      beforeEach(async (done) => {
        commit = jest.fn()
        // @ts-ignore
        fetchVariables.mockResolvedValue([{ foo: 'bar' }])
        await actions.loadGridVariables({
          getters: { searchTermQuery: 'i am not empty' },
          commit,
          state: {
            treeSelected: 3
          }
        })
        done()
      })

      it('should update the gridVariable with the fetch result', () => {
        expect(commit).toHaveBeenCalledWith('updateGridVariables', [{ foo: 'bar' }])
      })
    })

    describe('when searchTermQuery changes before values are fetched ', () => {
      let commit: any

      beforeEach(async (done) => {
        commit = jest.fn()
        let getCount = 0
        const getters = {
          get searchTermQuery () {
            if (getCount === 0) {
              getCount++
              return 'original search term'
            }
            return 'changed search term'
          }
        }
        // @ts-ignore
        fetchVariables.mockResolvedValue([{ foo: 'bar' }])
        await actions.loadGridVariables({
          getters,
          commit,
          state: {
            treeSelected: 3
          }
        })
        done()
      })

      it('should not commit the fetched results', () => {
        expect(fetchVariables).toHaveBeenCalled()
        expect(commit).not.toHaveBeenCalledWith('updateGridVariables', [{ foo: 'bar' }])
      })
    })
  })

  describe('loadVariables', () => {
    it('loads all variables', async (done) => {
      const commit = jest.fn()
      const action = actions.loadVariables({ commit })
      await action
      expect(commit).toHaveBeenCalledWith('updateVariables', {
        2: { 'id': 2, 'label': 'Suncream used', 'name': 'ARZON', subsections: [1] },
        3: { 'id': 3, 'label': 'SAF', 'name': 'SAF', subsections: [1, 2] },
        4: { 'id': 4, 'label': 'Reflection', 'name': 'UVREFLECT', subsections: [1] },
        5: { 'id': 5, 'label': 'Skin cream used', 'name': 'ARCREME', subsections: [] }
      })
      done()
    })
  })

  describe('loadParticipantCount', () => {
    it('loads new participant count if rsql is empty', async (done) => {
      const commit = jest.fn()
      const response = actions.loadParticipantCount({ commit, getters: { rsql: '' } })
      expect(commit).toHaveBeenCalledWith('updateParticipantCount', null)
      await response
      expect(commit).toHaveBeenCalledWith('updateParticipantCount', 123456)
      done()
    })
    it('loads new participant count if rsql is nonempty', async (done) => {
      const commit = jest.fn()
      const response = actions.loadParticipantCount({ commit, getters: { rsql: 'll_nr.yob=le=1970' } })
      expect(commit).toHaveBeenCalledWith('updateParticipantCount', null)
      await response
      expect(commit).toHaveBeenCalledWith('updateParticipantCount', 3456)
      done()
    })
    it('does not commit the participant count if the rsql has been updated while loading', async (done) => {
      const commit = jest.fn()
      const getters = { rsql: 'll_nr.yob=le=1970' }
      const response = actions.loadParticipantCount({ commit, getters })
      expect(commit).toHaveBeenCalledWith('updateParticipantCount', null)
      getters.rsql = 'll_nr.yob=le=1971'
      await response
      expect(commit).toHaveBeenCalledTimes(1)
      done()
    })
  })

  describe('loadGridData', () => {
    it('loads new variant counts if rsql is empty', async (done) => {
      const commit = jest.fn()
      const response = actions.loadGridData({ commit, getters: { rsql: '' } })
      expect(commit).toHaveBeenCalledWith('updateVariantCounts', null)
      await response
      expect(commit).toHaveBeenCalledWith('updateVariantCounts', [
        { 'count': 12340, 'variantId': 1 },
        { 'count': 56780, 'variantId': 10 }
      ])
      done()
    })

    it('loads new variant counts if rsql is nonempty', async (done) => {
      const commit = jest.fn()
      await actions.loadGridData({ commit, getters: { rsql: 'll_nr.yob=le=1970' } })
      expect(commit).toHaveBeenCalledWith('updateVariantCounts', null)
      expect(commit).toHaveBeenCalledWith('updateVariantCounts', [
        { 'count': 1234, 'variantId': 1 },
        { 'count': 5678, 'variantId': 10 }
      ])
      done()
    })

    it('does not commit the variant counts if the rsql has changed during the call', async (done) => {
      const commit = jest.fn()
      const getters = { rsql: 'll_nr.yob=le=1970' }
      const action = actions.loadGridData({ commit, getters })
      expect(commit).toHaveBeenCalledWith('updateVariantCounts', null)
      getters.rsql = ''
      await action
      expect(commit).toHaveBeenCalledTimes(1)
      done()
    })
  })

  describe('load', () => {
    it('loads grid selection', async (done) => {
      const commit = jest.fn()
      const state = {
        ...emptyState,
        assessments: { 1: { id: 1, name: '1A' } },
        variables: {
          1: { id: 1, name: 'VAR1', label: 'Variable 1', subsections: [1, 2] },
          2: { id: 2, name: 'VAR2', label: 'Variable 2', subsections: [2] }
        }
      }
      await actions.load({ commit, state }, 'fghij')
      expect(commit).toHaveBeenCalledWith('setToast', { message: 'Loaded order with orderNumber fghij', textType: 'light', timeout: Vue.prototype.$global.toastTimeoutTime, title: 'Success', type: 'success' })
      expect(commit).toHaveBeenCalledWith('updateGridSelection', { 1: [1], 2: [1] })
      expect(commit).toHaveBeenCalledWith('updateFacetFilter', { ...emptyState.facetFilter, ageGroupAt1A: ['2', '3'] })
      done()
    })
  })

  describe('copyOrder', () => {
    describe('copyOrder as shopper / creator', () => {
      beforeEach(async (done) => {
        const sourceNumber = 'source_order_with_form'
        const commit = jest.fn()
        const state: ApplicationState = {
          ...emptyState
        }
        await actions.copyOrder({ commit, state }, sourceNumber)
        done()
      })

      it('copies order and changes order number', async (done) => {
        const sourceNumber = 'source_order'
        const commit = jest.fn()
        const state: ApplicationState = {
          ...emptyState
        }
        jest.spyOn(orderService, 'buildFormData').mockImplementation(() => new FormData())
        jest.spyOn(orderService, 'generateOrderNumber').mockImplementation(() => 'Copy123')
        post.mockResolvedValue('success')

        const newOrderNumber = await actions.copyOrder({ commit, state }, sourceNumber)

        expect(newOrderNumber).toBeDefined()
        expect(newOrderNumber).not.toMatch(sourceNumber)
        done()
      })
    })

    describe('copyOrder as data manager', () => {
      beforeEach(async (done) => {
        const sourceOrderNumber = 'sourceOrderNumber_dm_test'
        const commit = jest.fn()
        const state = {
          context: {
            context: {
              username: 'dm-name'
            }
          },
          orderFormFields: []
        }
        jest.spyOn(orderService, 'buildFormData').mockImplementation(() => new FormData())
        jest.spyOn(orderService, 'generateOrderNumber').mockImplementation(() => 'dm-copy')
        post.mockResolvedValue('success')
        await actions.copyOrder({ commit, state }, sourceOrderNumber)
        done()
      })

      it('should give order creator permissions on copy', () => {
        // give perm to order
        expect(setUserPermission).nthCalledWith(1, 'dm-copy', 'lifelines_order', 'bert', 'WRITE')
        // give perm to cart data
        expect(setUserPermission).nthCalledWith(2, 'dm-copy-order-content-id', 'sys_FileMeta', 'bert', 'WRITE')
        // give perm to applicationForm file
        expect(setUserPermission).nthCalledWith(3, 'dm-copy-order-applicationForm-id', 'sys_FileMeta', 'bert', 'WRITE')
      })
    })
  })

  describe('save', () => {
    describe('if orderNumber is set', () => {
      it('saves grid selection', async (done) => {
        const commit = jest.fn()
        const dispatch = jest.fn()
        const state = getApplicationState()
        post.mockResolvedValue('success')
        const response = await actions.save({ state, commit, dispatch })
        expect(commit).toHaveBeenCalledWith('setToast', { message: 'Saved order with order number 12345', textType: 'light', timeout: Vue.prototype.$global.toastTimeoutTime, title: 'Success', type: 'success' })
        expect(response).toBe('12345')
        expect(post).toHaveBeenCalledWith('/api/v1/lifelines_order/12345?_method=PUT', expect.anything(), true)
        done()
      })
    })

    describe('if orderNumber not set', () => {
      it('saves grid selection', async (done) => {
        const commit = jest.fn()
        const dispatch = jest.fn()

        const state: ApplicationState = {
          ...emptyState,
          order: {
            orderNumber: null,
            name: null,
            projectNumber: null,
            applicationForm: null,
            state: OrderState.Draft,
            submissionDate: 'submissionDate',
            creationDate: 'creationDate',
            updateDate: 'updateDate',
            contents: null,
            user: 'test',
            email: 'test@molgenis.org'
          }
        }

        jest.spyOn(orderService, 'buildFormData').mockImplementation(() => new FormData())
        jest.spyOn(orderService, 'generateOrderNumber').mockImplementation(() => '12345')
        post.mockResolvedValue('success')
        const response = await actions.save({ state, commit, dispatch })
        expect(commit).toHaveBeenCalledWith('setToast', { message: 'Saved order with order number 12345', textType: 'light', timeout: Vue.prototype.$global.toastTimeoutTime, title: 'Success', type: 'success' })
        expect(response).toBe('12345')
        expect(post).toHaveBeenCalledWith('/api/v1/lifelines_order', expect.anything(), true)
        done()
      })
    })

    describe('if applicationForm is a fileRef', () => {
      it('saves order', async (done) => {
        const commit = jest.fn()
        const dispatch = jest.fn()
        const state = getApplicationState()

        jest.spyOn(orderService, 'buildFormData').mockImplementation(() => new FormData())
        post.mockResolvedValue('success')
        await actions.save({ state, commit, dispatch })
        expect(commit).toHaveBeenCalledWith('setToast', { message: 'Saved order with order number 12345', textType: 'light', timeout: Vue.prototype.$global.toastTimeoutTime, title: 'Success', type: 'success' })
        expect(post).toHaveBeenCalledWith('/api/v1/lifelines_order/12345?_method=PUT', expect.anything(), true)
        done()
      })
    })

    describe('when the submission not succesful', () => {
      let result: any
      let commit: any
      const dispatch = jest.fn()

      beforeEach(async (done) => {
        commit = jest.fn()

        const state = getApplicationState()
        post.mockRejectedValue('error')
        result = await actions.save({ commit, state, dispatch })
        done()
      })

      it('should resturn undefined', () => {
        expect(commit).not.toHaveBeenCalledWith('setToast', { message: 'Loaded order with orderNumber 12345', textType: 'light', timeout: Vue.prototype.$global.toastTimeoutTime, title: 'Success', type: 'success' })
        expect(result).toBeUndefined()
      })
    })
  })

  describe('submit', () => {
    describe('if orderNumber is set', () => {
      it('submits the order', async (done) => {
        const commit = jest.fn()
        const dispatch = jest.fn()
        const state = getApplicationState()
        post.mockResolvedValue('success')
        await actions.submit({ state, commit, dispatch })
        expect(commit).toHaveBeenCalledWith('setToast', { message: 'Submitted order with order number 12345', textType: 'light', timeout: Vue.prototype.$global.toastTimeoutTime, title: 'Success', type: 'success' })
        expect(dispatch).toHaveBeenCalledWith('givePermissionToOrder')
        expect(dispatch).toHaveBeenCalledWith('sendSubmissionTrigger')
        done()
      })
    })
    describe('if orderNumber not yet set', () => {
      it('submits the order', async (done) => {
        const commit = jest.fn()
        const dispatch = jest.fn()
        const state = getApplicationState()

        post.mockResolvedValue('success')
        await actions.submit({ state, commit, dispatch })
        expect(commit).toHaveBeenCalledWith('setToast', { message: 'Submitted order with order number 12345', textType: 'light', timeout: Vue.prototype.$global.toastTimeoutTime, title: 'Success', type: 'success' })
        expect(dispatch).toHaveBeenCalledWith('givePermissionToOrder')
        expect(dispatch).toHaveBeenCalledWith('sendSubmissionTrigger')
        done()
      })
    })

    describe('when the submission not succesfull', () => {
      let result: any
      let commit: any
      let dispatch: any
      let state: ApplicationState
      beforeEach(async (done) => {
        commit = jest.fn()
        dispatch = jest.fn()
        const state = getApplicationState()

        post.mockRejectedValue('error')
        result = await actions.submit({ commit, state, dispatch })
        done()
      })

      it('should return undefined', () => {
        expect(result).toBeUndefined()
        expect(commit).not.toHaveBeenCalledWith('setToast', { type: 'success', message: 'Submitted order with order number 12345' })
        expect(dispatch).not.toHaveBeenCalledWith('givePermissionToOrder')
        expect(dispatch).not.toHaveBeenCalledWith('sendSubmissionTrigger')
      })
    })
  })

  describe('givePermissionToOrder', () => {
    let state: any
    beforeEach(async (done) => {
      state = {
        order: {
          orderNumber: '3333'
        }
      }
      await actions.givePermissionToOrder({ state, commit: jest.fn() })
      done()
    })
    it('should resturn undefined', () => {
      expect(post).toHaveBeenCalledWith('/api/v1/lifelines_order', expect.anything(), true)
    })
  })

  describe('fixUserPermission', () => {
    describe('state does not contain required parameters', () => {
      let state: any
      let commit = jest.fn()
      beforeEach(() => {
        state = {
          order: {
            orderNumber: null
          }
        }
      })

      it('throws an error', async (done) => {
        await actions.fixUserPermission({ commit, state })
        expect(commit).toHaveBeenCalledWith('setToast', expect.objectContaining({
          message: 'Can not set permission if orderNumber or contents or user is not set'
        }))
        done()
      })
    })

    describe('state contains required parameters', () => {
      let state: any
      let commit = jest.fn()

      beforeEach(async (done) => {
        state = {
          order: {
            applicationForm: { id: 'applicationForm' },
            orderNumber: '12345',
            contents: { id: 'contents' },
            user: 'user'
          }
        }

        await actions.fixUserPermission({ commit, state })
        done()
      })

      afterEach(() => {
        jest.resetAllMocks()
      })

      it('calls setUserPermission', () => {
        expect(setUserPermission).toHaveBeenCalledWith('contents', 'sys_FileMeta', 'user', 'WRITE')
        expect(setUserPermission).toHaveBeenCalledWith('applicationForm', 'sys_FileMeta', 'user', 'WRITE')
      })
    })
  })

  describe('givePermissionToOrder with missing orderNumber', () => {
    let state: any
    beforeEach(async (done) => {
      post.mockReset()
      state = {
        order: {
          orderNumber: null
        }
      }
      await actions.givePermissionToOrder({ state, commit: jest.fn() })
      done()
    })
    it('should resturn undefined', () => {
      expect(post).not.toHaveBeenCalled()
    })
  })

  describe('givePermissionToOrder with file attached', () => {
    let state: any
    beforeEach(async (done) => {
      state = {
        order: {
          orderNumber: '12345',
          contents: { id: 'contents-id' },
          applicationForm: {
            id: 'app-form'
          }
        }
      }
      await actions.givePermissionToOrder({ state, commit: jest.fn() })
      done()
    })

    it('should call permission service', () => {
      expect(setRolePermission).nthCalledWith(1, '12345', 'lifelines_order', 'LIFELINES_MANAGER', 'WRITE')
      expect(setRolePermission).nthCalledWith(2, 'contents-id', 'sys_FileMeta', 'LIFELINES_MANAGER', 'WRITE')
      expect(setRolePermission).nthCalledWith(3, 'app-form', 'sys_FileMeta', 'LIFELINES_MANAGER', 'WRITE')
    })
  })

  describe('sendSubmissionTrigger', () => {
    let mockPost = jest.fn()
    beforeEach(async (done) => {
      mockPost.mockResolvedValue('yep yep')
      axios.post = mockPost
      await actions.sendSubmissionTrigger()
      done()
    })
    it('should send a trigger of type submit', () => {
      expect(mockPost).toHaveBeenCalledWith('/edge-server/trigger?type=submit')
    })
  })

  describe('sendSubmissionTrigger error handling', () => {
    let mockPost = jest.fn()

    beforeEach(async (done) => {
      console.log = jest.fn()
      mockPost.mockRejectedValue('my err')
      axios.post = mockPost
      await actions.sendSubmissionTrigger()
      done()
    })

    it('should send a trigger of type submit', () => {
      expect(console.log).toBeCalledWith('Send submit trigger failed')
      expect(console.log).toBeCalledWith('my err')
    })

    afterEach(() => {
      // @ts-ignore
      console.log.mockClear()
    })
  })
})
