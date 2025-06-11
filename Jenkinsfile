pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-registry.com'
        IMAGE_TAG = "${BUILD_NUMBER}"
        KUBECONFIG = credentials('kubeconfig')
        DOCKER_CREDENTIALS = credentials('docker-registry-credentials')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('apps/backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('apps/frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }
        
        stage('Lint and Type Check') {
            parallel {
                stage('Backend Lint') {
                    steps {
                        dir('apps/backend') {
                            sh 'npm run lint'
                        }
                    }
                }
                stage('Frontend Lint') {
                    steps {
                        dir('apps/frontend') {
                            sh 'npm run lint'
                            sh 'npm run type-check'
                        }
                    }
                }
            }
        }
        
        stage('Test') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('apps/backend') {
                            sh 'npm test'
                        }
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'apps/backend/coverage/junit.xml'
                            publishCoverage adapters: [
                                istanbulCoberturaAdapter('apps/backend/coverage/cobertura-coverage.xml')
                            ]
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('apps/frontend') {
                            sh 'npm test -- --coverage --watchAll=false'
                        }
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'apps/frontend/coverage/junit.xml'
                        }
                    }
                }
            }
        }
        
        stage('Build') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('apps/backend') {
                            sh 'npm run build'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('apps/frontend') {
                            sh 'npm run build'
                        }
                    }
                }
            }
        }
        
        stage('Docker Build') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    branch 'staging'
                }
            }
            parallel {
                stage('Build Backend Image') {
                    steps {
                        script {
                            def backendImage = docker.build(
                                "${DOCKER_REGISTRY}/woms-backend:${IMAGE_TAG}",
                                "-f apps/backend/Dockerfile ."
                            )
                            docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS) {
                                backendImage.push()
                                backendImage.push("latest")
                            }
                        }
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        script {
                            def frontendImage = docker.build(
                                "${DOCKER_REGISTRY}/woms-frontend:${IMAGE_TAG}",
                                "-f apps/frontend/Dockerfile ."
                            )
                            docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS) {
                                frontendImage.push()
                                frontendImage.push("latest")
                            }
                        }
                    }
                }
            }
        }
        
        stage('Security Scan') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                // Add security scanning tools like Snyk, OWASP, etc.
                sh 'echo "Running security scans..."'
                // sh 'snyk test'
                // sh 'npm audit'
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    sh """
                        kubectl set image deployment/woms-backend woms-backend=${DOCKER_REGISTRY}/woms-backend:${IMAGE_TAG} -n woms-staging
                        kubectl set image deployment/woms-frontend woms-frontend=${DOCKER_REGISTRY}/woms-frontend:${IMAGE_TAG} -n woms-staging
                        kubectl rollout status deployment/woms-backend -n woms-staging
                        kubectl rollout status deployment/woms-frontend -n woms-staging
                    """
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    input message: 'Deploy to production?', ok: 'Deploy'
                    sh """
                        kubectl set image deployment/woms-backend woms-backend=${DOCKER_REGISTRY}/woms-backend:${IMAGE_TAG} -n woms
                        kubectl set image deployment/woms-frontend woms-frontend=${DOCKER_REGISTRY}/woms-frontend:${IMAGE_TAG} -n woms
                        kubectl rollout status deployment/woms-backend -n woms
                        kubectl rollout status deployment/woms-frontend -n woms
                    """
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            slackSend(
                channel: '#deployments',
                color: 'good',
                message: "✅ WOMS deployment successful - Build #${BUILD_NUMBER} deployed to ${env.BRANCH_NAME}"
            )
        }
        failure {
            slackSend(
                channel: '#deployments',
                color: 'danger',
                message: "❌ WOMS deployment failed - Build #${BUILD_NUMBER} on ${env.BRANCH_NAME}"
            )
        }
    }
} 