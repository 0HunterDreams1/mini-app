import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';

// Interfaces para las respuestas de la API
interface CandidateData {
  uuid: string;
  candidateId: string;
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Job {
  id: string;
  title: string;
  description?: string;
}

interface JobListResponse {
  jobs?: Job[];
  [key: string]: unknown;
}
// Tiraba error el body por que necesitaba el campo applicationId, entonces lo agruegue al momento de hacer el envio.
interface ApplicationRequest {
  applicationId: string;
  uuid: string;
  jobId: string;
  candidateId: string;
  repoUrl: string;
}

interface ApplicationResponse {
  ok: boolean;
  message?: string;
}

export function JobApplicationForm() {
  // Estado para email del candidato
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Hooks para las tres llamadas a API
  const {
    data: candidateData,
    loading: loadingCandidate,
    error: candidateError,
    get: getCandidate,
  } = useApi<CandidateData>();

  const {
    data: jobsData,
    loading: loadingJobs,
    error: jobsError,
    get: getJobs,
  } = useApi<JobListResponse>();

  const { loading: loadingApplication, error: applicationError, post } = useApi<ApplicationResponse>();

  // Estado para URLs de repositorio de cada trabajo
  const [repoUrls, setRepoUrls] = useState<{ [jobId: string]: string }>({});

  // Estado para aplicaciones exitosas
  const [successfulApplications, setSuccessfulApplications] = useState<Set<string>>(
    new Set()
  );

  // Obtener datos del candidato por email
  const handleGetCandidateData = async () => {
    if (!email) {
      alert('Por favor ingresa tu email');
      return;
    }
    try {
      await getCandidate(`/api/candidate/get-by-email?email=${encodeURIComponent(email)}`);
      setEmailSubmitted(true);
    } catch (err) {
      console.error('Error al obtener datos del candidato:', err);
    }
  };

  // Obtener lista de trabajos (cuando se obtienen datos del candidato)
  useEffect(() => {
    if (candidateData && emailSubmitted) {
      getJobs('/api/jobs/get-list');
    }
  }, [candidateData, emailSubmitted, getJobs]);

  // Enviar postulación
  const handleApplyToJob = async (jobId: string) => {
    const repoUrl = repoUrls[jobId];
    
    if (!repoUrl) {
      alert('Por favor ingresa la URL de tu repositorio');
      return;
    }

    if (!candidateData) {
      alert('Datos del candidato no disponibles');
      return;
    }
    // Me di cuenta en el devtools del navegador, que era un error de body, y especificaba que campo faltaba enviar, entonces lo agregue al body de la solicitud. Ahora ya no tira error y se puede aplicar al trabajo correctamente.
    try {
      const applicationData: ApplicationRequest = {
        applicationId: candidateData.applicationId,
        uuid: candidateData.uuid,
        jobId,
        candidateId: candidateData.candidateId,
        repoUrl,
      };
      // Como tiraba error, hice un console.log para mostrar los datos que se van a enviar
      console.log(applicationData);

      await post('/api/candidate/apply-to-job', applicationData);
      // Marcar como aplicación exitosa
      setSuccessfulApplications((prev) => new Set(prev).add(jobId));
      
      // Limpiar URL después de aplicar exitosamente
      setTimeout(() => {
        setRepoUrls((prev) => ({ ...prev, [jobId]: '' }));
      }, 2000);
    } catch (err) {
      console.error('Error al aplicar:', err);
    }
  };

  // Cancelar y volver a introducir email
  const handleCancel = () => {
    setEmail('');
    setEmailSubmitted(false);
    // Reiniciar los estados de la API
    window.location.reload();
  };

  return (
    <>
        <div style={styles.titleHeader}>
            <h4>Portal de Aplicación de Candidatos</h4>
        </div>
        <div style={styles.container}>
            <div style={styles.form}>

            {/* Email Input */}
            {!candidateData && (
            <div style={styles.section}>
                <h2 style={styles.textTitleContent}>Obtener los datos</h2>
                <p style={{color:'#000000'}}>Ingresa tu email para obtener tus datos de candidato:</p>
                
                <div style={styles.emailInputGroup}>
                <input
                    type="email"
                    placeholder="tu.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGetCandidateData()}
                    style={styles.input}
                />
                <button
                    onClick={handleGetCandidateData}
                    disabled={loadingCandidate}
                    style={{
                    ...styles.button,
                    opacity: loadingCandidate ? 0.6 : 1,
                    }}
                >
                    {loadingCandidate ? 'Cargando...' : 'Obtener Datos'}
                </button>
                </div>

                {candidateError && (
                <div style={styles.error}>
                    Error: {candidateError.message}
                </div>
                )}
            </div>
            )}

            {/* Candidato encontrado */}
            {candidateData && (
            <>
                <div style={styles.header}>
                    <div style={styles.buttonDivBack}>
                        <button onClick={handleCancel} style={styles.iconButton}>
                            <FontAwesomeIcon style={{color:'#2e1a47'}} icon={faArrowLeft} size="lg" />
                        </button>
                    </div>
                    <div style={styles.candidateInfoHeader}>
                        <h2 style={styles.textTitleContent}>Datos del Candidato</h2>
                    </div>
                </div>
                <div style={styles.candidateDiv}>
                    <div style={styles.candidateIcon}>
                        <FontAwesomeIcon style={{color:'#2e1a47'}} icon={faCircleUser} size="10x" />
                    </div>
                    <div style={styles.candidateInfo}>
                        <p style={styles.pInfo}>
                            <strong>Nombre completo:</strong> {candidateData.firstName} {candidateData.lastName}
                        </p>
                        <p style={styles.pInfo}>
                            <strong>Email:</strong> {candidateData.email}
                        </p>
                        <p style={styles.pInfo}>
                            <strong>UUID:</strong> <code>{candidateData.uuid}</code>
                        </p>
                        <p style={styles.pInfo}>
                            <strong>Candidate ID:</strong> <code>{candidateData.candidateId}</code>
                        </p>
                        <p style={styles.pInfo}>
                            <strong>Aplication ID:</strong> <code>{candidateData.applicationId}</code>
                        </p>
                    </div>
                </div>

                {/* Lista de trabajos */}
                <div style={styles.section}>
                <h2 style={styles.textTitleContent}>Posiciones Disponibles</h2>

                {loadingJobs && <p> Cargando posiciones...</p>}

                {jobsError && (
                    <div style={styles.error}>
                    Error al cargar posiciones: {jobsError.message}
                    </div>
                )}

                {jobsData &&
                    (Array.isArray(jobsData) ? jobsData : jobsData.jobs || []).length > 0 ? (
                    <div style={styles.jobsList}>
                    {(Array.isArray(jobsData) ? jobsData : jobsData.jobs || []).map(
                        (job: Job) => (
                        <div key={job.id} style={styles.jobCard}>
                            <div style={styles.jobHeader}>
                            <h3>{job.title}</h3>
                            {job.description && (
                                <p style={styles.jobDescription}>{job.description}</p>
                            )}
                            </div>

                            {successfulApplications.has(job.id) ? (
                            <div style={styles.success}>
                                ¡Aplicación enviada exitosamente!
                            </div>
                            ) : (
                            <div style={styles.jobForm}>
                                <input
                                type="url"
                                placeholder="https://github.com/tu-usuario/tu-repo"
                                value={repoUrls[job.id] || ''}
                                onChange={(e) =>
                                    setRepoUrls((prev) => ({
                                    ...prev,
                                    [job.id]: e.target.value,
                                    }))
                                }
                                style={styles.input}
                                />
                                <button
                                onClick={() => handleApplyToJob(job.id)}
                                disabled={loadingApplication}
                                style={{
                                    ...styles.submitButton,
                                    opacity: loadingApplication ? 0.6 : 1,
                                }}
                                >
                                {loadingApplication ? 'Enviando...' : 'Enviar'}
                                </button>
                            </div>
                            )}

                            {applicationError && !successfulApplications.has(job.id) && (
                            <div style={styles.error}>
                                Error: {applicationError.message}
                            </div>
                            )}
                        </div>
                        )
                    )}
                    </div>
                ) : !loadingJobs && !jobsError ? (
                    <p>No hay posiciones disponibles en este momento.</p>
                ) : null}
                </div>
            <div style={styles.buttonDivBack}>
            <button
            onClick={handleCancel}
            style={styles.cancelButton}>
            Cancelar
            </button>
            </div>
            </>
            )}
        </div>
        </div>

    </>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    // width: '100%',
    height: '100%',
    minHeight: '100vh',
    backgroundColor: '#f4f8f8',
  } as React.CSSProperties,
  titleHeader: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '20px',
    paddingBottom: '20px',
    backgroundColor: 'rgba(46, 26, 71, 1)',
    inset: '0 0 auto 0', 
  } as React.CSSProperties,
  form: {
    background: 'none',
    borderRadius: '8px',
    height: '100%',
    width: '100%',
    padding: '5px 30px 5px 30px',
    margin: '5px 150px 5px 150px',
    backgroundColor: '#dfdede',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  section: {
    marginBottom: '30px',
  } as React.CSSProperties,
  emailInputGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
  } as React.CSSProperties,
  textTitleContent: {
    color: '#2e1a47',
  } as React.CSSProperties,
  header: {
    display: 'flex',
  } as React.CSSProperties,
  candidateInfoHeader: {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '15px',
  } as React.CSSProperties,
  candidateDiv: {
    display: 'flex',
    // justifyContent: 'center',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '30px',
  } as React.CSSProperties,
  pInfo: {
    fontSize:'16px', 
    margin: '0 0 0 0'
  }as React.CSSProperties,
  candidateInfo: {
    display:"flex", 
    justifyContent:"space-around",
    flexDirection:"column", 
    textAlign:"left", 
    marginLeft:"10px",
    backgroundColor: 'rgba(46, 26, 71, 0.7)',
    border: '1px solid #0a0a0ad5',
    borderRadius: '6px',
    paddingLeft: '20px',
    paddingRight: '20px',
    width: '100%',
  } as React.CSSProperties,
  candidateIcon: {
    display:"flex", 
    justifyContent:"flex-start", 
    alignItems:"center",
    marginRight:"10px",
    padding: '5px',
    // backgroundColor: 'rgba(46, 26, 71, 0.7)',
    background: 'none',
    // border: '1px solid #0a0a0ad5',
    borderRadius: '6px',
  } as React.CSSProperties,
  buttonDivBack: {
    display: 'flex', 
    flex: '0 0 auto',
    justifyContent: 'flex-start',
    marginTop: '20px',
  } as React.CSSProperties,
  iconButton: {
    padding: '4px 5px',
    fontSize: '12px',
    color: 'white',
    background: 'none',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '28px',
    width: '28px',
    minWidth: '28px',
    lineHeight: '1',
  } as React.CSSProperties,
  jobsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '15px',
  } as React.CSSProperties,
  jobCard: {
    padding: '15px',
    border: '1px solid #000000',
    borderRadius: '6px',
    backgroundColor: 'rgba(46, 26, 71, 0.5)',
  } as React.CSSProperties,
  jobHeader: {
    marginBottom: '12px',
  } as React.CSSProperties,
  jobDescription: {
    fontSize: '0.9em',
    color: '#666',
    marginTop: '5px',
  } as React.CSSProperties,
  jobForm: {
    display: 'flex',
    gap: '10px',
  } as React.CSSProperties,
  input: {
    flex: 1,
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  button: {
    padding: '8px 24px',
    fontSize: '16px',
    color: 'white',
    backgroundColor: '#2e1a47',
    fontFamily: 'Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  } as React.CSSProperties,
  submitButton: {
    padding: '8px 24px',
    fontSize: '16px',
    color: 'white',
    fontFamily: 'Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif',
    backgroundColor: '#2e1a47',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  } as React.CSSProperties,
  cancelButton: {
    padding: '8px 24px',
    fontSize: '16px',
    color: 'white',
    fontFamily: 'Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif',
    backgroundColor: '#c23d38',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  } as React.CSSProperties,
  error: {
    padding: '12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '6px',
    marginTop: '10px',
    border: '1px solid #f5c6cb',
  } as React.CSSProperties,
  success: {
    padding: '12px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '6px',
    marginTop: '10px',
    border: '1px solid #c3e6cb',
  } as React.CSSProperties,
};
