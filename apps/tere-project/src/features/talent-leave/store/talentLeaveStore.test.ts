import { useTalentLeaveStore } from './talentLeaveStore';

describe('talentLeaveStore', () => {
  // Reset store before each test
  beforeEach(() => {
    const store = useTalentLeaveStore.getState();
    // Reset to initial state
    store.setSelectedMonthStart(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );
    store.closeModal();
  });

  describe('selectedMonthStart', () => {
    it('should have current month as initial selectedMonthStart', () => {
      const { selectedMonthStart } = useTalentLeaveStore.getState();
      const expectedDate = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      );

      expect(selectedMonthStart.getFullYear()).toBe(expectedDate.getFullYear());
      expect(selectedMonthStart.getMonth()).toBe(expectedDate.getMonth());
      expect(selectedMonthStart.getDate()).toBe(1);
    });

    it('should update selectedMonthStart correctly', () => {
      const { setSelectedMonthStart } = useTalentLeaveStore.getState();
      const newDate = new Date(2024, 5, 1); // June 1, 2024

      setSelectedMonthStart(newDate);

      const { selectedMonthStart } = useTalentLeaveStore.getState();
      expect(selectedMonthStart.getFullYear()).toBe(2024);
      expect(selectedMonthStart.getMonth()).toBe(5);
      expect(selectedMonthStart.getDate()).toBe(1);
    });
  });

  describe('modalState', () => {
    it('should have initial modalState closed with create mode', () => {
      const { modalState } = useTalentLeaveStore.getState();

      expect(modalState.open).toBe(false);
      expect(modalState.mode).toBe('create');
      expect(modalState.leaveId).toBeUndefined();
    });

    it('should set modalState to open with create mode when openCreateModal is called', () => {
      const { openCreateModal } = useTalentLeaveStore.getState();

      openCreateModal();

      const { modalState } = useTalentLeaveStore.getState();
      expect(modalState.open).toBe(true);
      expect(modalState.mode).toBe('create');
      expect(modalState.leaveId).toBeUndefined();
    });

    it('should set modalState to open with edit mode and leaveId when openEditModal is called', () => {
      const { openEditModal } = useTalentLeaveStore.getState();
      const testLeaveId = 'leave-123';

      openEditModal(testLeaveId);

      const { modalState } = useTalentLeaveStore.getState();
      expect(modalState.open).toBe(true);
      expect(modalState.mode).toBe('edit');
      expect(modalState.leaveId).toBe(testLeaveId);
    });

    it('should set modalState to closed when closeModal is called', () => {
      const { openEditModal, closeModal } = useTalentLeaveStore.getState();

      // First open a modal
      openEditModal('leave-123');
      expect(useTalentLeaveStore.getState().modalState.open).toBe(true);

      // Then close it
      closeModal();

      const { modalState } = useTalentLeaveStore.getState();
      expect(modalState.open).toBe(false);
      expect(modalState.mode).toBe('create');
    });
  });

  describe('state immutability', () => {
    it('should create new state objects on updates', () => {
      const initialState = useTalentLeaveStore.getState();
      const initialModalState = initialState.modalState;
      const initialDate = initialState.selectedMonthStart;

      // Update modal state
      initialState.openCreateModal();
      const afterModalState = useTalentLeaveStore.getState().modalState;

      // Should be a new object
      expect(afterModalState).not.toBe(initialModalState);

      // Update month
      initialState.setSelectedMonthStart(new Date(2024, 0, 1));
      const afterDateUpdate = useTalentLeaveStore.getState().selectedMonthStart;

      // Should be a new date
      expect(afterDateUpdate).not.toBe(initialDate);
    });
  });
});
