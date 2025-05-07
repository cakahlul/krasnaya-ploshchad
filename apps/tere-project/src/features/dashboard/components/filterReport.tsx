import { Select } from 'antd';
import { useSprintDataTransform } from '../hooks/useSprintDataTransform';
import { useSprintFilterStore } from '../store/useSprintFilterStore';
import { useTeamReportFilterStore } from '../store/useTeamReportFilterStore';

export function FilterReport() {
  const { sprints, isLoading } = useSprintDataTransform();
  const board = useSprintFilterStore(state => state.board);
  const setBoardId = useSprintFilterStore(state => state.setSelectedBoard);

  const boardNameMap: Record<number, string> = {
    143: 'DS',
    142: 'SLS',
  };

  const setSelectedFilter = useTeamReportFilterStore(
    state => state.setSelectedFilter,
  );

  const handleTeamChange = (value: number) => {
    if (board.id !== value) {
      //Reset filter if team changes
      setSelectedFilter({
        sprint: '',
        project: '',
      });
    }
    setBoardId({ id: value, name: boardNameMap[value] });
  };

  const handleSprintChange = (value: string) => {
    setSelectedFilter({
      sprint: value,
      project: board.name,
    });
  };

  return (
    <div className="flex flex-col gap-4 pl-4">
      <div className="flex flex-row gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="project">Team</label>
          <Select
            showSearch
            style={{ width: 200 }}
            placeholder="Select team"
            optionFilterProp="label"
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '')
                .toLowerCase()
                .localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={[
              {
                value: 143,
                label: 'Funding - DS Board',
              },
              {
                value: 142,
                label: 'Lending - SLS Board',
              },
            ]}
            onChange={handleTeamChange}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="sprint">Sprint</label>
          <Select
            showSearch
            style={{ width: 200 }}
            placeholder="Select sprint"
            optionFilterProp="label"
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '')
                .toLowerCase()
                .localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={sprints}
            onChange={handleSprintChange}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
