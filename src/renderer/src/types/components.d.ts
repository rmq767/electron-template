import type MySearch from '@renderer/components/my-search/index.vue'
import type MyTable from '@renderer/components/my-table/index.vue'
import type MyPagination from '@renderer/components/my-pagination/index.vue'
import type MyDialog from '@renderer/components/my-dialog/index.vue'
import type MyDrawer from '@renderer/components/my-drawer/index.vue'
import type WindowGate from '@renderer/components/window-gate/index.vue'

declare module 'vue' {
  export interface GlobalComponents {
    MySearch: typeof MySearch
    MyTable: typeof MyTable
    MyPagination: typeof MyPagination
    MyDialog: typeof MyDialog
    MyDrawer: typeof MyDrawer
    WindowGate: typeof WindowGate
  }
}

export {}
