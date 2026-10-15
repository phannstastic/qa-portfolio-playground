describe('QA Portfolio Playground - E2E UI Automation', () => {
  // Track created test items for guaranteed teardown / cleanup
  const createdItemIds: number[] = []

  // Safe cleanup helper to delete only items created by this suite
  const cleanupCreatedItems = () => {
    while (createdItemIds.length > 0) {
      const id = createdItemIds.pop()
      if (id) {
        cy.request({
          method: 'DELETE',
          url: `/api/test-items/${id}`,
          failOnStatusCode: false,
        }).then((res) => {
          if (res.status === 200) {
            cy.log(`Cleaned up test item #${id}`)
          } else {
            cy.log(`Cleanup note: Item #${id} already removed or status ${res.status}`)
          }
        })
      }
    }
  }

  beforeEach(() => {
    // Intercept initial GET request for reliable synchronisation
    cy.intercept('GET', '/api/test-items').as('getTestItems')
  })

  after(() => {
    cleanupCreatedItems()
  })

  // =========================================================================
  // Baseline Positive Flows (Tests 1 - 8)
  // =========================================================================

  // 1. Dashboard opens properly
  it('1. Dashboard dapat dibuka dan menampilkan metrics overview', () => {
    cy.visit('/')
    cy.get('[data-testid="dashboard-heading"]').should('be.visible')
    cy.get('[data-testid="dashboard-heading"]').should('contain.text', 'Welcome to QA Portfolio Playground')
    cy.get('[data-testid="nav-dashboard"]').should('have.attr', 'aria-current', 'page')
  })

  // 2. Test Items page displays item list from API
  it('2. Halaman Test Items menampilkan daftar item dari API', () => {
    cy.visit('/')
    cy.get('[data-testid="nav-test-items"]').click()
    cy.wait('@getTestItems').its('response.statusCode').should('eq', 200)

    cy.get('[data-testid="test-items-heading"]').should('be.visible')
    cy.get('[data-testid="test-items-heading"]').should('contain.text', 'Test Items Catalog')

    // Verify table structure is rendered
    cy.get('[data-testid="test-items-table"]').should('exist')
  })

  // 3. Search finds item by title
  it('3. Search dapat menemukan item berdasarkan title secara live dan case-insensitive', () => {
    cy.visit('/')
    cy.get('[data-testid="nav-test-items"]').click()
    cy.wait('@getTestItems')

    // Find the first available item title to search for
    cy.get('[data-testid="test-item-title"]')
      .first()
      .invoke('text')
      .then((fullTitle) => {
        const searchTerm = fullTitle.trim().slice(0, 5)
        if (searchTerm) {
          // Search with uppercase query to verify case-insensitivity
          cy.get('[data-testid="search-input"]').type(`  ${searchTerm.toUpperCase()}  `)

          // All visible row titles should contain the search term (case-insensitive)
          cy.get('[data-testid="test-item-title"]').each(($el) => {
            expect($el.text().toLowerCase()).to.include(searchTerm.toLowerCase())
          })

          // Clear button should reset the search
          cy.get('[data-testid="clear-search-btn"]').should('be.visible').click()
          cy.get('[data-testid="search-input"]').should('have.value', '')
        }
      })
  })

  // 4. Status filter restricts list
  it('4. Filter status dapat membatasi daftar test items', () => {
    cy.visit('/')
    cy.get('[data-testid="nav-test-items"]').click()
    cy.wait('@getTestItems')

    // Select status filter "Draft"
    cy.get('[data-testid="filter-status-select"]').select('draft')

    // Check visible items: either all are draft or empty state is shown
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="test-item-row"]').length > 0) {
        cy.get('[data-testid="test-item-status"]').each(($badge) => {
          expect($badge.text().toLowerCase()).to.include('draft')
        })
      }
    })

    // Reset filter
    cy.get('[data-testid="reset-filters-btn"]').click()
    cy.get('[data-testid="filter-status-select"]').should('have.value', 'all')
  })

  // 5. Title A–Z sorting produces correct alphabetical order
  it('5. Sorting title A–Z menghasilkan urutan abjad yang benar', () => {
    cy.visit('/')
    cy.get('[data-testid="nav-test-items"]').click()
    cy.wait('@getTestItems')

    // Switch to Title A-Z
    cy.get('[data-testid="sort-select"]').select('title-asc')

    cy.get('[data-testid="test-item-title"]').then(($titles) => {
      const titles = $titles.map((_, el) => Cypress.$(el).text().trim()).get()
      if (titles.length > 1) {
        const sorted = [...titles].sort((a, b) => a.localeCompare(b))
        expect(titles).to.deep.equal(sorted)
      }
    })
  })

  // 6. Create item works using dedicated test data
  it('6. Create item dapat dilakukan menggunakan data uji khusus dengan prefix unik', () => {
    const uniqueTitle = `CYPRESS_TEST_CREATE_${Date.now()}`
    const testDescription = 'Automated end-to-end regression validation'

    cy.visit('/')
    cy.get('[data-testid="nav-test-items"]').click()
    cy.wait('@getTestItems')

    cy.intercept('POST', '/api/test-items').as('createTestItem')
    cy.intercept('GET', '/api/test-items').as('refreshAfterCreate')

    cy.get('[data-testid="create-item-btn"]').click()
    cy.get('[data-testid="create-modal"]').should('be.visible')

    cy.get('[data-testid="create-title-input"]').type(uniqueTitle)
    cy.get('#field-description').type(testDescription)
    cy.get('#field-status').select('in_progress')
    cy.get('#field-complexity').clear().type('7')
    cy.get('#field-is-automated').check()

    cy.get('[data-testid="create-submit-btn"]').click()

    cy.wait('@createTestItem').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201)
      const createdId = interception.response?.body?.data?.id
      expect(createdId).to.be.a('number')
      createdItemIds.push(createdId)

      cy.wait('@refreshAfterCreate')

      // Verify success notification
      cy.get('[data-testid="success-alert"]').should('be.visible')
      cy.get('[data-testid="success-alert"]').should('contain.text', 'created successfully')

      // Search for the newly created item to confirm presence
      cy.get('[data-testid="search-input"]').clear().type(uniqueTitle)
      cy.get(`[data-testid="edit-btn-${createdId}"]`).should('exist')
    })
  })

  // 7. Edit item updates title
  it('7. Edit item dapat memperbarui title test item', () => {
    // First create a standalone item to edit so this test is completely self-contained
    const initialTitle = `CYPRESS_TEST_BEFORE_EDIT_${Date.now()}`
    const updatedTitle = `CYPRESS_TEST_AFTER_EDIT_${Date.now()}`

    cy.request('POST', '/api/test-items', {
      title: initialTitle,
      description: 'Initial payload for edit test',
      status: 'draft',
      complexity: 3,
      isAutomated: false,
    }).then((createRes) => {
      const itemId = createRes.body.data.id
      createdItemIds.push(itemId)

      cy.visit('/')
      cy.get('[data-testid="nav-test-items"]').click()
      cy.wait('@getTestItems')

      // Find the specific item via search
      cy.get('[data-testid="search-input"]').clear().type(initialTitle)
      cy.get(`[data-testid="edit-btn-${itemId}"]`).should('be.visible').click()

      cy.get('[data-testid="edit-modal"]').should('be.visible')
      cy.get('[data-testid="edit-title-input"]').clear().type(updatedTitle)

      cy.intercept('PUT', `/api/test-items/${itemId}`).as('updateTestItem')
      cy.intercept('GET', '/api/test-items').as('refreshAfterEdit')

      cy.get('[data-testid="edit-submit-btn"]').click()

      cy.wait('@updateTestItem').its('response.statusCode').should('eq', 200)
      cy.wait('@refreshAfterEdit')

      // Verify success message and updated title
      cy.get('[data-testid="success-alert"]').should('be.visible')
      cy.get('[data-testid="success-alert"]').should('contain.text', 'updated successfully')

      cy.get('[data-testid="search-input"]').clear().type(updatedTitle)
      cy.get('[data-testid="test-item-title"]').first().should('contain.text', updatedTitle)
    })
  })

  // 8. Delete shows confirmation dialog and deletes item only after confirmation
  it('8. Delete menampilkan dialog konfirmasi dan hanya menghapus item setelah konfirmasi', () => {
    const deleteTargetTitle = `CYPRESS_TEST_DELETE_${Date.now()}`

    // Create item to test deletion
    cy.request('POST', '/api/test-items', {
      title: deleteTargetTitle,
      description: 'Item created specifically for delete confirmation verification',
      status: 'draft',
      complexity: 1,
      isAutomated: false,
    }).then((createRes) => {
      const itemId = createRes.body.data.id
      createdItemIds.push(itemId)

      cy.visit('/')
      cy.get('[data-testid="nav-test-items"]').click()
      cy.wait('@getTestItems')

      // Filter to target item
      cy.get('[data-testid="search-input"]').clear().type(deleteTargetTitle)
      cy.get(`[data-testid="delete-btn-${itemId}"]`).should('be.visible').click()

      // 1. Confirm dialog is displayed
      cy.get('[data-testid="delete-modal"]').should('be.visible')
      cy.get('#delete-modal-title').should('contain.text', 'Confirm Item Deletion')

      // 2. Click Cancel: modal closes, item NOT deleted
      cy.get('[data-testid="delete-cancel-btn"]').click()
      cy.get('[data-testid="delete-modal"]').should('not.exist')
      cy.get(`[data-testid="delete-btn-${itemId}"]`).should('exist')

      // 3. Click Delete again and confirm
      cy.get(`[data-testid="delete-btn-${itemId}"]`).click()
      cy.get('[data-testid="delete-modal"]').should('be.visible')

      cy.intercept('DELETE', `/api/test-items/${itemId}`).as('deleteTestItem')
      cy.intercept('GET', '/api/test-items').as('refreshAfterDelete')

      cy.get('[data-testid="delete-confirm-btn"]').click()

      cy.wait('@deleteTestItem').its('response.statusCode').should('eq', 200)
      cy.wait('@refreshAfterDelete')

      // Verify success banner and item removal
      cy.get('[data-testid="success-alert"]').should('be.visible')
      cy.get('[data-testid="success-alert"]').should('contain.text', 'deleted successfully')

      // Remove from tracker since it was already deleted
      const idx = createdItemIds.indexOf(itemId)
      if (idx !== -1) createdItemIds.splice(idx, 1)

      // Confirm item is no longer in the list
      cy.get(`[data-testid="delete-btn-${itemId}"]`).should('not.exist')
    })
  })

  // =========================================================================
  // Task 9.9 — Negative, Edge Cases, and Boundary Regression Tests (Tests 9 - 16)
  // =========================================================================

  // 9. Search with non-matching keywords displays empty state and clear button
  it('9. Search dengan kata kunci tidak cocok menampilkan empty state dan tombol pembersih', () => {
    cy.visit('/')
    cy.get('[data-testid="nav-test-items"]').click()
    cy.wait('@getTestItems')

    const nonExistentSearch = `__NON_EXISTENT_${Date.now()}__`
    cy.get('[data-testid="search-input"]').type(nonExistentSearch)

    // Empty state must be displayed
    cy.get('[data-testid="no-matching-empty-state"]').should('be.visible')
    cy.get('[data-testid="no-matching-empty-state"]').should('contain.text', 'No Matching Test Items')
    cy.get('[data-testid="no-matching-empty-state"]').should('contain.text', nonExistentSearch)

    // Data table should not be displayed
    cy.get('[data-testid="test-items-table"]').should('not.exist')

    // Click "Clear Search & Filters" button in empty state
    cy.get('[data-testid="clear-filters-btn"]').should('be.visible').click()

    // Search input should be cleared and items reappeared
    cy.get('[data-testid="search-input"]').should('have.value', '')
    cy.get('[data-testid="no-matching-empty-state"]').should('not.exist')
    cy.get('[data-testid="test-items-table"]').should('exist')
  })

  // 10. Reset Filters restores search, status, and sorting back to defaults
  it('10. Reset Filters mengembalikan search, status, dan sorting ke nilai default', () => {
    cy.visit('/')
    cy.get('[data-testid="nav-test-items"]').click()
    cy.wait('@getTestItems')

    // Apply non-default search, status, and sorting
    cy.get('[data-testid="search-input"]').type('regression')
    cy.get('[data-testid="filter-status-select"]').select('in_progress')
    cy.get('[data-testid="sort-select"]').select('complexity-asc')

    // Reset button should now be visible
    cy.get('[data-testid="reset-filters-btn"]').should('be.visible').click()

    // Assert all controls return to default values
    cy.get('[data-testid="search-input"]').should('have.value', '')
    cy.get('[data-testid="filter-status-select"]').should('have.value', 'all')
    cy.get('[data-testid="sort-select"]').should('have.value', 'newest')

    // Reset button should hide once in default state
    cy.get('[data-testid="reset-filters-btn"]').should('not.exist')
  })

  // 11. Create with empty title or whitespace displays validation and does NOT send POST
  it('11. Create dengan title kosong atau whitespace menampilkan validasi dan tidak mengirim POST', () => {
    let postSent = false
    cy.intercept('POST', '/api/test-items', () => {
      postSent = true
    })

    cy.visit('/')
    cy.get('[data-testid="nav-test-items"]').click()
    cy.wait('@getTestItems')

    cy.get('[data-testid="create-item-btn"]').click()
    cy.get('[data-testid="create-modal"]').should('be.visible')

    // Submit with only whitespace
    cy.get('[data-testid="create-title-input"]').type('     ')
    cy.get('[data-testid="create-submit-btn"]').click()

    // Client-side validation error must appear
    cy.get('#field-title-error')
      .should('be.visible')
      .and('contain.text', 'Title is required')

    // Modal stays open so user does not lose state
    cy.get('[data-testid="create-modal"]').should('be.visible')

    // Verify network was not hit
    cy.then(() => {
      expect(postSent).to.equal(false)
    })

    // Cancel modal cleanly
    cy.get('[data-testid="create-cancel-btn"]').click()
    cy.get('[data-testid="create-modal"]').should('not.exist')
  })

  // 12. Create with boundary valid data (title 255 chars, max complexity 10) succeeds
  it('12. Create dengan boundary data valid (title 255 karakter dan complexity 10) tetap berhasil', () => {
    // Generate valid 255-character title
    const prefix = `CYPRESS_TEST_BOUNDARY_${Date.now()}_`
    const boundaryTitle = (prefix + 'A'.repeat(255)).slice(0, 255)

    cy.visit('/')
    cy.get('[data-testid="nav-test-items"]').click()
    cy.wait('@getTestItems')

    cy.intercept('POST', '/api/test-items').as('createBoundaryItem')
    cy.intercept('GET', '/api/test-items').as('refreshBoundary')

    cy.get('[data-testid="create-item-btn"]').click()
    cy.get('[data-testid="create-title-input"]').type(boundaryTitle)
    cy.get('#field-status').select('completed')
    cy.get('#field-complexity').clear().type('10')

    cy.get('[data-testid="create-submit-btn"]').click()

    cy.wait('@createBoundaryItem').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201)
      const itemId = interception.response?.body?.data?.id
      expect(itemId).to.be.a('number')
      createdItemIds.push(itemId)

      cy.wait('@refreshBoundary')
      cy.get('[data-testid="success-alert"]').should('be.visible')

      // Confirm item appears via search
      cy.get('[data-testid="search-input"]').type(prefix)
      cy.get(`[data-testid="edit-btn-${itemId}"]`).should('exist')
    })
  })

  // 13. Edit with whitespace title displays validation and does NOT send PUT
  it('13. Edit dengan title whitespace menampilkan validasi dan tidak mengirim PUT', () => {
    const tempTitle = `CYPRESS_TEST_EDIT_WS_${Date.now()}`

    cy.request('POST', '/api/test-items', {
      title: tempTitle,
      description: 'Temporary item for negative edit validation',
      status: 'draft',
      complexity: 2,
      isAutomated: false,
    }).then((res) => {
      const itemId = res.body.data.id
      createdItemIds.push(itemId)

      let putSent = false
      cy.intercept('PUT', `/api/test-items/${itemId}`, () => {
        putSent = true
      })

      cy.visit('/')
      cy.get('[data-testid="nav-test-items"]').click()
      cy.wait('@getTestItems')

      cy.get('[data-testid="search-input"]').type(tempTitle)
      cy.get(`[data-testid="edit-btn-${itemId}"]`).should('be.visible').click()

      cy.get('[data-testid="edit-modal"]').should('be.visible')
      cy.get('[data-testid="edit-title-input"]').clear().type('   ')

      cy.get('[data-testid="edit-submit-btn"]').click()

      // Error message must appear
      cy.get('#field-edit-title-error')
        .should('be.visible')
        .and('contain.text', 'Title is required')

      // Modal remains open
      cy.get('[data-testid="edit-modal"]').should('be.visible')

      // No PUT request sent
      cy.then(() => {
        expect(putSent).to.equal(false)
      })

      // Cancel modal cleanly
      cy.get('[data-testid="edit-cancel-btn"]').click()
      cy.get('[data-testid="edit-modal"]').should('not.exist')
    })
  })

  // 14. Isolated Error Handling: GET 500 displays error banner and retry button
  it('14. Isolated Error Handling: respons API 500 pada GET menampilkan banner error dan tombol retry', () => {
    cy.intercept('GET', '/api/test-items', {
      statusCode: 500,
      body: { success: false, error: { message: 'Database connection pool exhausted' } },
    }).as('mockGet500')

    cy.visit('/')
    cy.get('[data-testid="nav-test-items"]').click()
    cy.wait('@mockGet500')

    // Error card must be displayed with server error message
    cy.get('[data-testid="fetch-error-card"]').should('be.visible')
    cy.get('[data-testid="fetch-error-card"]').should('contain.text', 'Database connection pool exhausted')
    cy.get('[data-testid="fetch-error-card"]').should('contain.text', 'Retry Request')
  })

  // 15. Isolated Error Handling: POST 500 displays error alert inside create modal
  it('15. Isolated Error Handling: respons API 500 pada POST menampilkan pesan error di dalam modal', () => {
    cy.visit('/')
    cy.get('[data-testid="nav-test-items"]').click()
    cy.wait('@getTestItems')

    cy.intercept('POST', '/api/test-items', {
      statusCode: 500,
      body: { success: false, error: { message: 'Simulated backend crash on insert' } },
    }).as('mockPost500')

    cy.get('[data-testid="create-item-btn"]').click()
    cy.get('[data-testid="create-title-input"]').type(`CYPRESS_TEST_FAIL_${Date.now()}`)
    cy.get('[data-testid="create-submit-btn"]').click()
    cy.wait('@mockPost500')

    // Error alert inside modal must show backend error message
    cy.get('[data-testid="create-modal"]')
      .should('be.visible')
      .and('contain.text', 'Simulated backend crash on insert')
    cy.get('[data-testid="create-cancel-btn"]').click()
    cy.get('[data-testid="create-modal"]').should('not.exist')
  })

  // 16. Isolated Error Handling: DELETE 404 displays error alert inside delete modal
  it('16. Isolated Error Handling: respons API 404 pada DELETE menampilkan pesan error di dalam modal', () => {
    const tempTitle = `CYPRESS_TEST_ERR404_${Date.now()}`

    cy.request('POST', '/api/test-items', {
      title: tempTitle,
      description: 'Temporary item for delete 404 test',
      status: 'draft',
      complexity: 2,
      isAutomated: false,
    }).then((res) => {
      const itemId = res.body.data.id
      createdItemIds.push(itemId)

      cy.visit('/')
      cy.get('[data-testid="nav-test-items"]').click()
      cy.wait('@getTestItems')

      cy.get('[data-testid="search-input"]').type(tempTitle)
      cy.get(`[data-testid="delete-btn-${itemId}"]`).should('be.visible').click()
      cy.get('[data-testid="delete-modal"]').should('be.visible')

      cy.intercept('DELETE', `/api/test-items/${itemId}`, {
        statusCode: 404,
        body: { success: false, error: { message: 'Test item not found or already deleted' } },
      }).as('mockDelete404')

      cy.get('[data-testid="delete-confirm-btn"]').click()
      cy.wait('@mockDelete404')

      // Error alert inside delete modal must display 404 message
      cy.get('[data-testid="delete-modal"]')
        .should('be.visible')
        .and('contain.text', 'Test item not found or already deleted')
      cy.get('[data-testid="delete-cancel-btn"]').click()
      cy.get('[data-testid="delete-modal"]').should('not.exist')
    })
  })

  // 17. Cancel on Delete dialog closes modal and does NOT send DELETE request
  it('17. Cancel pada dialog Delete tidak mengirim request DELETE', () => {
    const tempTitle = `CYPRESS_TEST_CANCEL_DEL_${Date.now()}`

    cy.request('POST', '/api/test-items', {
      title: tempTitle,
      description: 'Temporary item to verify delete cancellation',
      status: 'draft',
      complexity: 3,
      isAutomated: false,
    }).then((res) => {
      const itemId = res.body.data.id
      createdItemIds.push(itemId)

      let deleteSent = false
      cy.intercept('DELETE', `/api/test-items/${itemId}`, () => {
        deleteSent = true
      })

      cy.visit('/')
      cy.get('[data-testid="nav-test-items"]').click()
      cy.wait('@getTestItems')

      cy.get('[data-testid="search-input"]').type(tempTitle)
      cy.get(`[data-testid="delete-btn-${itemId}"]`).should('be.visible').click()

      cy.get('[data-testid="delete-modal"]').should('be.visible')

      // Click cancel
      cy.get('[data-testid="delete-cancel-btn"]').click()

      // Modal closed, delete button still present
      cy.get('[data-testid="delete-modal"]').should('not.exist')
      cy.get(`[data-testid="delete-btn-${itemId}"]`).should('exist')

      // Assert no DELETE network call was made
      cy.then(() => {
        expect(deleteSent).to.equal(false)
      })
    })
  })

  // 18. Filter mismatch keeps item count and empty state fully consistent
  it('18. Ketika data tidak cocok dengan filter, jumlah item dan empty state tetap konsisten', () => {
    cy.visit('/')
    cy.get('[data-testid="nav-test-items"]').click()
    cy.wait('@getTestItems').then((interception) => {
      const totalCount = interception.response?.body?.data?.length || 0

      if (totalCount > 0) {
        // Apply an unmatchable query
        const unmatchedQuery = `__ZERO_MATCH_${Date.now()}__`
        cy.get('[data-testid="search-input"]').type(unmatchedQuery)

        // Item count badge should display "0 of N items"
        cy.get('[data-testid="items-count-badge"]')
          .should('be.visible')
          .and('contain.text', `0 of ${totalCount} items`)

        // Empty state must describe the query
        cy.get('[data-testid="no-matching-empty-state"]')
          .should('be.visible')
          .and('contain.text', unmatchedQuery)

        // Clear query
        cy.get('[data-testid="clear-search-btn"]').click()

        // Badge returns to full count format
        cy.get('[data-testid="items-count-badge"]')
          .should('be.visible')
          .and('not.contain.text', '0 of')
      }
    })
  })
})
