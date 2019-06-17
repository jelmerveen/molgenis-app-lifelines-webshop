import { mount, Wrapper } from '@vue/test-utils'
import Vue from 'vue'
import CollapsibleTree from '@/components/tree/CollapsibleTree.vue'

describe('CollapsibleTree.vue', () => {
  let wrapper: Wrapper<Vue>

  beforeEach(() => {
    wrapper = mount(CollapsibleTree, {
      stubs: {
        'font-awesome-icon': '<div/>'
      },
      propsData: {
        value: '',
        structure: [
          {
            name: 'test-parent',
            open: true,
            children: [
              {
                name: 'test-child'
              }
            ]
          }
        ]
      }
    })
  })

  it('should render a list with a test-parent and test-child', () => {
    const items = wrapper.findAll('[title]')
    expect(items.length).toEqual(2)
    expect(items.at(0).text()).toEqual('test-parent')
    expect(items.at(1).text()).toEqual('test-child')
  })

  it('can close and hide children', () => {
    wrapper.find('[title="test-parent"]').trigger('click')
    let items = wrapper.findAll('[title]')
    expect(items.length).toEqual(1)
    wrapper.find('[title="test-parent"]').trigger('click')
    items = wrapper.findAll('[title]')
    expect(items.length).toEqual(2)
  })

  it('can can select child', () => {
    wrapper.find('[title="test-child"]').trigger('click')
    expect(wrapper.emitted().input[0]).toEqual(['test-child'])
  })

})
