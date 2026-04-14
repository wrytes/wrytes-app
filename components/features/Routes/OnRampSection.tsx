import { faArrowTurnDown } from '@fortawesome/free-solid-svg-icons';
import { PageHeader, Section } from '@/components/ui/Layout';
import { Table, TableBody, TableHead, TableRowEmpty } from '@/components/ui/Table';

const ONRAMP_HEADERS = ['Label', 'Source', 'Currency', 'Amount', 'Status'];

export default function OnRampSection() {
  return (
    <Section>
      <PageHeader
        title="On-Ramp"
        description="Fiat-to-crypto conversion routes"
        icon={faArrowTurnDown}
      />
      <Table>
        <TableHead
          headers={ONRAMP_HEADERS}
          colSpan={ONRAMP_HEADERS.length}
          tab="Label"
          reverse={false}
          tabOnChange={() => {}}
        />
        <TableBody>
          <TableRowEmpty>No on-ramp routes yet. Coming soon.</TableRowEmpty>
        </TableBody>
      </Table>
    </Section>
  );
}
