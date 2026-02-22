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
        <div className='titleHeader'>
            <h4>Portal de Aplicación de Candidatos</h4>
        </div>
        <div className='container'>
            <div className='form'>

            {/* Email Input */}
            {!candidateData && (
            <div className='section'>
                <h2 className='textTitleContent'>Obtener los datos</h2>
                <p style={{color:'#000000'}}>Ingresa tu email para obtener tus datos de candidato:</p>
                
                <div className='emailInputGroup'>
                <input
                    type="email"
                    placeholder="tu.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGetCandidateData()}
                    className='input'
                />
                <button
                    onClick={handleGetCandidateData}
                    disabled={loadingCandidate}
                    className='button'
                >
                    {loadingCandidate ? 'Cargando...' : 'Obtener Datos'}
                </button>
                </div>

                {candidateError && (
                <div className='error'>
                    Error: {candidateError.message}
                </div>
                )}
            </div>
            )}

            {/* Candidato encontrado */}
            {candidateData && (
            <>
                <div className='header'>
                    <div className='buttonDivBack'>
                        <button onClick={handleCancel} className='iconButton'>
                            <FontAwesomeIcon style={{color:'#2e1a47'}} icon={faArrowLeft} size="lg" />
                        </button>
                    </div>
                    <div className='candidateInfoHeader'>
                        <h2 className='textTitleContent'>Datos del Candidato</h2>
                    </div>
                </div>
                <div className='candidateDiv'>
                    <div className='candidateIcon'>
                        <FontAwesomeIcon style={{color:'#2e1a47'}} icon={faCircleUser} size="10x" />
                    </div>
                    <div className='candidateInfo'>
                        <p className='pInfo'>
                            <strong>Nombre completo:</strong> {candidateData.firstName} {candidateData.lastName}
                        </p>
                        <p className='pInfo'>
                            <strong>Email:</strong> {candidateData.email}
                        </p>
                        <p className='pInfo'>
                            <strong>UUID:</strong> <code>{candidateData.uuid}</code>
                        </p>
                        <p className='pInfo'>
                            <strong>Candidate ID:</strong> <code>{candidateData.candidateId}</code>
                        </p>
                        <p className='pInfo'>
                            <strong>Aplication ID:</strong> <code>{candidateData.applicationId}</code>
                        </p>
                    </div>
                </div>

                {/* Lista de trabajos */}
                <div className='section'>
                <h2 className='textTitleContent'>Posiciones Disponibles</h2>

                {loadingJobs && <p> Cargando posiciones...</p>}

                {jobsError && (
                    <div className='error'>
                    Error al cargar posiciones: {jobsError.message}
                    </div>
                )}

                {jobsData &&
                    (Array.isArray(jobsData) ? jobsData : jobsData.jobs || []).length > 0 ? (
                    <div className='jobsList'>
                    {(Array.isArray(jobsData) ? jobsData : jobsData.jobs || []).map(
                        (job: Job) => (
                        <div key={job.id} className='jobCard'>
                            <div className='jobHeader'>
                            <h3>{job.title}</h3>
                            {job.description && (
                                <p className='jobDescription'>{job.description}</p>
                            )}
                            </div>

                            {successfulApplications.has(job.id) ? (
                            <div className='success'>
                                ¡Aplicación enviada exitosamente!
                            </div>
                            ) : (
                            <div className='jobForm'>
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
                               className='input'
                                />
                                <button
                                onClick={() => handleApplyToJob(job.id)}
                                disabled={loadingApplication}
                                className='submitButton'
                                >
                                {loadingApplication ? 'Enviando...' : 'Enviar'}
                                </button>
                            </div>
                            )}

                            {applicationError && !successfulApplications.has(job.id) && (
                            <div className='error'>
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
            <div className='buttonDivBack'>
            <button
            onClick={handleCancel}
            className='cancelButton'>
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

