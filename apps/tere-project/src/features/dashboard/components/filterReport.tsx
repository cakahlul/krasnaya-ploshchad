import { Select } from 'antd';

export function filterReport() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="project">Project</label>
          <input
            type="text"
            id="project"
            placeholder="Project"
            className="border border-gray-300 rounded p-2"
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
            options={[
              {
                value: '1',
                label: 'Not Identified',
              },
              {
                value: '2',
                label: 'Closed',
              },
              {
                value: '3',
                label: 'Communicated',
              },
              {
                value: '4',
                label: 'Identified',
              },
              {
                value: '5',
                label: 'Resolved',
              },
              {
                value: '6',
                label: 'Cancelled',
              },
            ]}
          />
        </div>
      </div>
      <button className="bg-blue-500 text-white rounded p-2">Filter</button>
    </div>
  );
}
