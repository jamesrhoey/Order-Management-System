class AIInsights {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.salesAI = new SalesAI(apiUrl);
        this.orderAI = new OrderAI(apiUrl);
        this.transactionAI = new TransactionAI(apiUrl);
    }

    async initialize() {
        await Promise.all([
            this.salesAI.initialize(),
            this.orderAI.initialize(),
            this.transactionAI.initialize()
        ]);
    }
}

class SalesAI {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

    async initialize() {
        try {
            const salesData = await this.fetchSalesData();
            this.displaySalesInsights(salesData);
        } catch (error) {
            console.error('Error initializing Sales AI:', error);
        }
    }

    async fetchSalesData() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/ai/analyze-sales`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            return result.data || {
                trends: { dailyAverages: 0, growth: 0 },
                forecast: { nextDayForecast: 0, confidence: 'low' },
                insights: [{ message: 'No sales data available' }]
            };
        } catch (error) {
            console.error('Error fetching sales data:', error);
            return {
                trends: { dailyAverages: 0, growth: 0 },
                forecast: { nextDayForecast: 0, confidence: 'low' },
                insights: [{ message: 'Error fetching sales data' }]
            };
        }
    }

    displaySalesInsights(data) {
        const insightsContainer = document.getElementById('sales-insights');
        if (!insightsContainer) return;

        const { trends, forecast, insights } = data;

        const html = `
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="fas fa-robot me-2"></i>AI Sales Insights</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <h6 class="fw-bold">Trends</h6>
                            <p>Daily Average: ₱${trends.dailyAverages.toFixed(2)}</p>
                            <p>Growth Rate: ${trends.growth.toFixed(1)}%</p>
                        </div>
                        <div class="col-md-4">
                            <h6 class="fw-bold">Forecast</h6>
                            <p>Next Day: ₱${forecast.nextDayForecast.toFixed(2)}</p>
                            <p>Confidence: ${forecast.confidence}</p>
                        </div>
                        <div class="col-md-4">
                            <h6 class="fw-bold">Key Insights</h6>
                            ${insights.map(insight => `
                                <div class="alert alert-info py-2 px-3 mb-2">
                                    ${insight.message}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        insightsContainer.innerHTML = html;
    }
}

class OrderAI {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

    async initialize() {
        try {
            await this.setupOrderPredictions();
        } catch (error) {
            console.error('Error initializing Order AI:', error);
        }
    }

    async analyzeOrder(orderId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/ai/analyze-order/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            return result.data || {
                likelihood: 50,
                confidence: 'low',
                recommendations: [{ message: 'Error analyzing order' }]
            };
        } catch (error) {
            console.error('Error analyzing order:', error);
            return {
                likelihood: 50,
                confidence: 'low',
                recommendations: [{ message: 'Error analyzing order' }]
            };
        }
    }

    async setupOrderPredictions() {
        const orderCards = document.querySelectorAll('.order-card');
        orderCards.forEach(card => {
            card.addEventListener('click', async (e) => {
                const orderId = card.dataset.orderId;
                if (!orderId) return;

                const prediction = await this.analyzeOrder(orderId);
                this.displayOrderPrediction(prediction);
            });
        });
    }

    displayOrderPrediction(prediction) {
        Swal.fire({
            title: 'Order Analysis',
            html: `
                <div class="text-start">
                    <h6 class="fw-bold mb-3">Success Prediction</h6>
                    <p>Likelihood: ${prediction.likelihood}%</p>
                    <p>Confidence: ${prediction.confidence}</p>
                    
                    <h6 class="fw-bold mb-3 mt-4">Recommendations</h6>
                    ${prediction.recommendations.map(rec => `
                        <div class="alert alert-info py-2 px-3 mb-2">
                            ${rec.message}
                        </div>
                    `).join('')}
                </div>
            `,
            icon: 'info',
            width: '600px'
        });
    }
}

class TransactionAI {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

    async initialize() {
        try {
            const anomalies = await this.detectAnomalies();
            this.displayAnomalies(anomalies);
        } catch (error) {
            console.error('Error initializing Transaction AI:', error);
        }
    }

    async detectAnomalies() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiUrl}/ai/detect-anomalies`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error('Error detecting anomalies:', error);
            return [];
        }
    }

    displayAnomalies(anomalies) {
        const anomaliesContainer = document.getElementById('transaction-anomalies');
        if (!anomaliesContainer) return;

        const html = `
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-warning text-dark">
                    <h5 class="mb-0"><i class="fas fa-exclamation-triangle me-2"></i>Transaction Anomalies</h5>
                </div>
                <div class="card-body">
                    ${anomalies.length === 0 ? 
                        '<p class="text-muted mb-0">No anomalies detected</p>' :
                        anomalies.map(anomaly => `
                            <div class="alert alert-warning mb-2">
                                <h6 class="fw-bold mb-1">Transaction #${anomaly.transactionId}</h6>
                                <p class="mb-1">Anomaly Score: ${anomaly.score}%</p>
                                <p class="mb-0 small">${anomaly.reasons.join(', ')}</p>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;

        anomaliesContainer.innerHTML = html;
    }
}

// Export the main class
window.AIInsights = AIInsights; 