// ========================
// MÓDULO AGENDA (Tarefas)
// ========================
const AgendaModule = {
    tarefas: [],
    currentDate: new Date(),
    viewMode: 'week', // 'week' ou 'day'

    init() {
        this.carregarTarefas();
        // Atualiza a cada minuto
        setInterval(() => this.carregarTarefas(), 60000);
        
        // Renderiza inicial
        this.renderCalendar();
        this.renderTimeline();
    },

    async carregarTarefas() {
        try {
            const response = await fetch(`/corretores/api/tarefas?_=${new Date().getTime()}`);
            this.tarefas = await response.json();
            
            this.renderCalendar();
            this.renderTimeline();
            this.renderTodayEvents();
        } catch (error) {
            console.error('Erro ao carregar agenda:', error);
        }
    },

    // --- Navegação ---

    mudarMes(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    },
    
    selecionarDia(year, month, day) {
        this.currentDate = new Date(year, month, day);
        this.renderCalendar();
        this.renderTimeline();
        this.renderTodayEvents();
    },

    mudarVisualizacao(mode) {
        this.viewMode = mode;
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === mode);
        });
        
        this.renderTimeline();
    },

    // --- Renderização ---

    renderCalendar() {
        const grid = document.getElementById('mini-calendar');
        const monthLabel = document.getElementById('current-month-year');
        if (!grid || !monthLabel) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        monthLabel.textContent = `${meses[month]} ${year}`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const startingDay = firstDay.getDay(); 
        const totalDays = lastDay.getDate();
        
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        let html = '';
        
        for (let i = 0; i < startingDay; i++) {
            const d = prevMonthLastDay - startingDay + 1 + i;
            html += `<div class="calendar-day other-month">${d}</div>`;
        }
        
        for (let i = 1; i <= totalDays; i++) {
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const hasEvent = this.tarefas.some(t => t.data_limite && t.data_limite.startsWith(dateStr) && !t.concluida);
            
            let classes = 'calendar-day';
            if (i === this.currentDate.getDate() && month === this.currentDate.getMonth() && year === this.currentDate.getFullYear()) {
                classes += ' active';
            }
            if (hasEvent) classes += ' has-event';
            
            html += `<div class="${classes}" onclick="AgendaModule.selecionarDia(${year}, ${month}, ${i})">${i}</div>`;
        }
        
        const remainingSlots = 7 - ((startingDay + totalDays) % 7);
        if (remainingSlots < 7) {
            for (let i = 1; i <= remainingSlots; i++) {
                html += `<div class="calendar-day other-month">${i}</div>`;
            }
        }

        grid.innerHTML = html;
    },

    renderTimeline() {
        const container = document.getElementById('agenda-grid');
        const rangeLabel = document.getElementById('current-week-range');
        if (!container) return;

        container.innerHTML = '';
        
        let startDate;
        let daysToShow = 7;

        if (this.viewMode === 'week') {
            startDate = new Date(this.currentDate);
            startDate.setDate(this.currentDate.getDate() - this.currentDate.getDay());
            daysToShow = 7;
        } else {
            startDate = new Date(this.currentDate);
            daysToShow = 1;
        }

        container.style.gridTemplateColumns = `repeat(${daysToShow}, 1fr)`;
        
        for (let i = 0; i < daysToShow; i++) {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);
            
            const isToday = new Date().toDateString() === currentDay.toDateString();
            
            const y = currentDay.getFullYear();
            const m = String(currentDay.getMonth() + 1).padStart(2, '0');
            const d = String(currentDay.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;
            
            const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][currentDay.getDay()];
            const dayNum = currentDay.getDate();
            
            const col = document.createElement('div');
            col.className = 'day-column';
            
            const header = document.createElement('div');
            header.className = `day-column-header ${isToday ? 'today' : ''}`;
            header.innerHTML = `<span>${dayName}</span><span>${dayNum}</span>`;
            
            col.appendChild(header);
            
            const dayEvents = this.tarefas.filter(t => {
                if (!t.data_limite) return false;
                return t.data_limite.startsWith(dateStr) && !t.concluida;
            });

            dayEvents.forEach(evt => {
                const parts = evt.data_limite.split(' ');
                const timeParts = parts[1].split(':');
                const hours = parseInt(timeParts[0], 10);
                const minutes = parseInt(timeParts[1], 10);
                
                let startHour = 8;
                let relativeHours = hours - startHour;
                
                let topPos;
                if (relativeHours < 0) {
                     topPos = 0; 
                } else {
                     // Ajuste para 50px por hora
                     topPos = (relativeHours * 50) + (minutes * 50 / 60);
                }
                
                const el = document.createElement('div');
                el.className = 'event-card';
                el.style.top = `${topPos + 40}px`; // +40px do header
                el.innerHTML = `
                    <span class="event-time">${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}</span>
                    <span class="event-title">${escapeHtml(evt.descricao)}</span>
                `;
                el.title = evt.descricao;
                el.onclick = (e) => {
                    e.stopPropagation();
                    AgendaModule.abrirDetalhesTarefa(evt);
                };
                
                col.appendChild(el);
            });
            
            container.appendChild(col);
        }
        
        const endDateCalc = new Date(startDate);
        endDateCalc.setDate(startDate.getDate() + daysToShow - 1);
        
        const options = { day: 'numeric', month: 'short' };
        if (daysToShow === 1) {
            rangeLabel.textContent = startDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
        } else {
            rangeLabel.textContent = `${startDate.toLocaleDateString('pt-BR', options)} - ${endDateCalc.toLocaleDateString('pt-BR', options)}`;
        }
    },

    renderTodayEvents() {
        const list = document.getElementById('today-events-list');
        if (!list) return;
        
        const y = this.currentDate.getFullYear();
        const m = String(this.currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(this.currentDate.getDate()).padStart(2, '0');
        const selectedDateStr = `${y}-${m}-${d}`;
        
        const events = this.tarefas.filter(t => 
            t.data_limite && t.data_limite.startsWith(selectedDateStr) && !t.concluida
        );
        
        if (events.length === 0) {
            list.innerHTML = '<p style="color:var(--text-secondary); font-size:0.8rem; text-align:center;">Sem eventos para este dia.</p>';
            return;
        }
        
        let html = '';
        events.forEach(t => {
            const timePart = t.data_limite.split(' ')[1].substring(0, 5); // HH:MM
            html += `
                <div class="agenda-task" style="padding: 8px; font-size: 0.8rem;">
                    <div class="task-check" style="width:16px; height:16px;" onclick="AgendaModule.toggleTarefa(${t.id}, true)"></div>
                    <div class="task-info">
                        <div class="task-text" style="font-size:0.85rem;">${escapeHtml(t.descricao)}</div>
                        <div class="task-meta"><i class="far fa-clock"></i> ${timePart}</div>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    },

    async abrirDetalhesTarefa(tarefa) {
        document.getElementById('detalhe-tarefa-descricao').textContent = tarefa.descricao;
        document.getElementById('detalhe-tarefa-data').innerHTML = `<i class="far fa-clock"></i> ${tarefa.data_formatada}`;
        document.getElementById('detalhe-tarefa-cliente').textContent = tarefa.cliente_nome || 'Nenhum (Tarefa Avulsa)';
        
        const btnConcluir = document.getElementById('btn-concluir-tarefa');
        
        // Remove listeners antigos (clone)
        const newBtn = btnConcluir.cloneNode(true);
        btnConcluir.parentNode.replaceChild(newBtn, btnConcluir);
        
        newBtn.onclick = () => {
            this.toggleTarefa(tarefa.id, true);
            document.getElementById('modal-detalhes-tarefa').classList.remove('active');
        };

        document.getElementById('modal-detalhes-tarefa').classList.add('active');
    },

    async toggleTarefa(id, concluida) {
        // Encontra o índice da tarefa
        const index = this.tarefas.findIndex(t => t.id === id);
        if (index === -1) return;

        // Armazena tarefa para possível rollback
        const tarefa = this.tarefas[index];
        const estadoAnterior = tarefa.concluida;

        // Atualiza estado localmente
        tarefa.concluida = concluida;

        // Se concluída, remove visualmente (filtra da lista ou re-renderiza sem ela)
        // Como o renderTimeline filtra (!t.concluida), basta re-renderizar
        this.renderCalendar();
        this.renderTimeline();
        this.renderTodayEvents();

        try {
            await fetch(`/corretores/api/tarefas/${id}/concluir`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concluida })
            });
            
            // Opcional: Recarregar do servidor para garantir sincronia
            // this.carregarTarefas(); 
        } catch (error) {
            console.error('Erro ao concluir tarefa:', error);
            // Rollback em caso de erro
            tarefa.concluida = estadoAnterior;
            this.renderCalendar();
            this.renderTimeline();
            this.renderTodayEvents();
            alert('Erro ao atualizar tarefa.');
        }
    },

    async criarTarefaAutomatica(leadId, nomeLead, tipoTentativa, btnElement) {
        console.log('Iniciando criação automática de tarefa:', { leadId, nomeLead, tipoTentativa });
        
        if (btnElement) {
            btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btnElement.disabled = true;
        }
        
        const now = new Date();
        const dataLimite = new Date(now);
        
        if (tipoTentativa <= 3) {
            dataLimite.setMinutes(dataLimite.getMinutes() + 10);
        } else if (tipoTentativa <= 6) {
            const horaAtual = now.getHours();
            if (horaAtual < 12) {
                dataLimite.setHours(14, 0, 0, 0);
            } else {
                dataLimite.setDate(dataLimite.getDate() + 1);
                dataLimite.setHours(9, 0, 0, 0);
            }
        } else {
            dataLimite.setDate(dataLimite.getDate() + 1);
        }

        const year = dataLimite.getFullYear();
        const month = String(dataLimite.getMonth() + 1).padStart(2, '0');
        const day = String(dataLimite.getDate()).padStart(2, '0');
        const hour = String(dataLimite.getHours()).padStart(2, '0');
        const minute = String(dataLimite.getMinutes()).padStart(2, '0');
        const second = String(dataLimite.getSeconds()).padStart(2, '0');
        
        const dataStr = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

        const descricao = `Ligar para ${nomeLead} - Tentativa ${tipoTentativa}`;

        try {
            const response = await fetch('/corretores/api/tarefas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cliente_id: leadId,
                    descricao: descricao,
                    data_limite: dataStr,
                    tipo: 'Ligação'
                })
            });
            
            const result = await response.json();
            if (response.ok) {
                if (btnElement) {
                    btnElement.innerHTML = '<i class="fas fa-check"></i> Agendado';
                    btnElement.classList.add('btn-success');
                } else {
                    alert('Tarefa agendada na sua agenda!');
                }
                this.carregarTarefas();
                return true;
            } else {
                if (btnElement) {
                    btnElement.innerHTML = 'Erro';
                    btnElement.disabled = false;
                }
                return false;
            }
        } catch (e) {
            console.error('Erro ao criar tarefa auto (catch):', e);
            if (btnElement) {
                btnElement.innerHTML = 'Erro';
                btnElement.disabled = false;
            }
            return false;
        }
    },
    
    async abrirModalNovaTarefa() {
        document.getElementById('form-nova-tarefa').reset();
        
        // Preenche data atual como default (ajustando fuso horário local para o input)
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('nova-tarefa-data').value = now.toISOString().slice(0,16);

        // Popula clientes
        const select = document.getElementById('nova-tarefa-cliente');
        select.innerHTML = '<option value="">Nenhum / Tarefa Avulsa</option>';
        
        // Tenta usar cache do ListasModule ou busca
        let leads = ListasModule.leads;
        if (!leads || leads.length === 0) {
             try {
                const response = await fetch(`/corretores/api/leads?filtro=meus&_=${new Date().getTime()}`);
                leads = await response.json();
                ListasModule.leads = leads; // Atualiza cache
            } catch (e) { console.error('Erro ao carregar clientes para select', e); }
        }

        if (leads && leads.length > 0) {
            leads.sort((a,b) => a.nome.localeCompare(b.nome)); // Ordena alfabeticamente
            leads.forEach(l => {
                const option = document.createElement('option');
                option.value = l.id;
                option.textContent = l.nome;
                select.appendChild(option);
            });
        }

        document.getElementById('modal-nova-tarefa').classList.add('active');
    },

    async salvarNovaTarefa() {
        const descricao = document.getElementById('nova-tarefa-descricao').value;
        const dataInput = document.getElementById('nova-tarefa-data').value; // YYYY-MM-DDTHH:mm
        const clienteId = document.getElementById('nova-tarefa-cliente').value;

        if (!descricao || !dataInput) {
            alert('Preencha descrição e data.');
            return;
        }
        
        // Converter datetime-local para formato SQL (YYYY-MM-DD HH:MM:SS)
        const dataFormatada = dataInput.replace('T', ' ') + ':00';

        const btn = document.querySelector('#form-nova-tarefa button[type="submit"]');
        const oldText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const body = {
                descricao: descricao,
                data_limite: dataFormatada,
                tipo: 'Geral'
            };
            
            if (clienteId) body.cliente_id = clienteId;

            const response = await fetch('/corretores/api/tarefas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            if (response.ok) {
                document.getElementById('modal-nova-tarefa').classList.remove('active');
                this.carregarTarefas();
            } else {
                alert('Erro ao salvar tarefa.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = oldText;
        }
    }
};
