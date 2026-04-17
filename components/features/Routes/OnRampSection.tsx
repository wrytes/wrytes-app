import { faArrowTrendUp } from '@fortawesome/free-solid-svg-icons';
import { PageHeader, Section } from '@/components/ui/Layout';
import { Badge } from '@/components/ui';
import { Table, TableBody, TableHead, TableRowEmpty } from '@/components/ui/Table';

const ONRAMP_HEADERS = ['Label', 'Source', 'Currency', 'Deposit Address', 'Status'];

interface Props {
  hasScope?: boolean;
}

export default function OnRampSection({ hasScope = false }: Props) {
  return (
    <Section>
      <PageHeader
        title="On-Ramp"
        description="Fiat-to-crypto conversion routes"
        icon={faArrowTrendUp}
      />
      {!hasScope ? (
        <p className="text-text-secondary text-sm">
          On-ramp access requires the{' '}
          <Badge
            text="ONRAMP"
            variant="custom"
            customColor="text-brand"
            customBgColor="bg-brand/10"
            size="sm"
          />{' '}
          scope.
        </p>
      ) : (
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
      )}
    </Section>
  );
}
