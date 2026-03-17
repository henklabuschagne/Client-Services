import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router';
import { AddDealDialog } from '../components/AddDealDialog';
import { toast } from 'sonner';

const STAGES = [
  { id: 'prospecting', label: 'Prospecting', color: 'bg-muted border-border' },
  { id: 'qualification', label: 'Qualification', color: 'bg-brand-primary-light border-brand-secondary/30' },
  { id: 'proposal', label: 'Proposal', color: 'bg-brand-warning-light border-brand-warning-mid' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-brand-error-light border-brand-error-mid' },
  { id: 'closed-won', label: 'Closed Won', color: 'bg-brand-success-light border-brand-success-mid' },
  { id: 'closed-lost', label: 'Closed Lost', color: 'bg-muted border-border' },
] as const;

interface DealCardProps {
  deal: any;
  contact: any;
  onNavigate: () => void;
}

const DealCard = ({ deal, contact, onNavigate }: DealCardProps) => {
  const { storeActions } = useAppStore('deals');

  const [{ isDragging }, drag] = useDrag({
    type: 'DEAL',
    item: { id: deal.id, stage: deal.stage },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={onNavigate}
    >
      <div className="mb-2">
        <h4 className="font-medium text-sm mb-1 line-clamp-2">{deal.title}</h4>
        <p className="text-xs text-gray-600">{contact?.name}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-green-600">
          <span className="font-semibold text-sm">
            R{deal.value.toLocaleString()}
          </span>
        </div>
        <Badge variant="outline" className="text-xs">
          {deal.probability}%
        </Badge>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Close: {format(parseISO(deal.expectedCloseDate), 'MMM d')}
      </p>
    </div>
  );
};

interface StageColumnProps {
  stage: typeof STAGES[number];
  deals: any[];
  contacts: any[];
  onNavigate: (contactId: string) => void;
}

const StageColumn = ({ stage, deals, contacts, onNavigate }: StageColumnProps) => {
  const { storeActions } = useAppStore('deals');

  const [{ isOver }, drop] = useDrop({
    accept: 'DEAL',
    drop: async (item: { id: string; stage: string }) => {
      if (item.stage !== stage.id) {
        const result = await storeActions.updateDeal(item.id, { stage: stage.id as any });
        if (result.success) {
          toast.success('Deal updated!', { description: `Moved to ${stage.label}` });
        } else {
          toast.error(result.error.message);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const stageDeals = deals.filter(d => d.stage === stage.id);
  const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex-1 min-w-[280px]">
      <div className={`border-2 rounded-lg ${stage.color} p-4 h-full`}>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{stage.label}</h3>
            <Badge variant="secondary">{stageDeals.length}</Badge>
          </div>
          <p className="text-sm text-gray-600 font-medium">
            R{stageValue.toLocaleString()}
          </p>
        </div>

        <div
          ref={drop}
          className={`space-y-3 min-h-[400px] ${isOver ? 'bg-blue-50 rounded-lg p-2' : ''}`}
        >
          {stageDeals.map(deal => {
            const contact = contacts.find(c => c.id === deal.contactId);
            return (
              <DealCard
                key={deal.id}
                deal={deal}
                contact={contact}
                onNavigate={() => contact && onNavigate(contact.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const Pipeline = () => {
  const { deals, contacts } = useAppStore('deals', 'contacts');
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = deals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);
  const activeDeals = deals.filter(d => !d.stage.includes('closed')).length;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl mb-2">Sales Pipeline</h1>
              <p className="text-muted-foreground">Track deals through your sales stages</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-primary-light rounded-lg">
                    <DollarSign className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                    <p className="text-2xl">R{totalValue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-success-light rounded-lg">
                    <TrendingUp className="w-6 h-6 text-brand-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Weighted Value</p>
                    <p className="text-2xl">R{Math.round(weightedValue).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-warning-light rounded-lg">
                    <DollarSign className="w-6 h-6 text-brand-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Deals</p>
                    <p className="text-2xl">{activeDeals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map(stage => (
              <StageColumn
                key={stage.id}
                stage={stage}
                deals={deals}
                contacts={contacts}
                onNavigate={(contactId) => navigate(`/contacts/${contactId}`)}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-brand-primary-light rounded-lg border border-brand-secondary/30">
          <p className="text-sm text-brand-main">
            <strong>Tip:</strong> Drag and drop deals between stages to update their status
          </p>
        </div>
      </div>

      <AddDealDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </DndProvider>
  );
};